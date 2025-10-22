from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.db import transaction
from django.utils.timezone import now
from xiu.models import Button, Content
import logging
from datetime import datetime

# 配置日志
logger = logging.getLogger(__name__)


def to_camel_case(snake_str):
    """
    将 snake_case 字符串转换为 camelCase。
    """
    components = snake_str.split('_')
    return components[0] + ''.join(x.title() for x in components[1:])


def transform_to_camel_case(data):
    """
    将字典或列表中的所有键从 snake_case 转换为 camelCase。
    """
    if isinstance(data, list):
        return [transform_to_camel_case(item) for item in data]
    elif isinstance(data, dict):
        return {to_camel_case(k): transform_to_camel_case(v) if isinstance(v, (dict, list)) else v for k, v in data.items()}
    else:
        return data


@api_view(["POST"])
@transaction.atomic
def add_content(request):
    logger.info("Received data: %s", request.data)
    print("Received data:", request.data)

    data = request.data
    button_id = data.get("buttonId")
    name = data.get("name")
    description = data.get("description")
    source = data.get("source")
    published_at = data.get("publishedAt")
    last_update = data.get("lastUpdate")

    if not button_id or not name:
        logger.error("Missing required fields: buttonId or name")
        return Response({"error": "buttonId 和 name 不能为空"}, status=400)

    try:
        button = Button.objects.get(id=button_id)
    except Button.DoesNotExist:
        logger.error(f"Button with ID {button_id} does not exist")
        return Response({"error": f"按钮 {button_id} 不存在，请联系管理员初始化按钮数据"}, status=404)

    if Content.objects.filter(
        button=button,
        name=name,
        description=description,
        source=source,
        published_at=published_at
    ).exists():
        logger.warning("Duplicate content detected: name=%s, description=%s", name, description)
        return Response({"error": "重复的内容已存在，新增失败"}, status=400)

    try:
        content = Content.objects.create(
            button=button,
            name=name,
            description=description,
            source=source,
            published_at=published_at,
        )
        logger.info("Content created successfully: %s", content)
    except Exception as e:
        logger.error("Failed to create content: %s", str(e))
        return Response({"error": "创建内容失败，请联系管理员"}, status=500)

    try:
        if last_update:
            new_contents = Content.objects.filter(button=button, created_at__gt=last_update)
        else:
            new_contents = Content.objects.filter(id=content.id)

        updated_button_data = {
            "button": {"id": button.id, "name": button.name},
            "contents": [
                {
                    "id": c.id,
                    "name": c.name,
                    "description": c.description,
                    "source": c.source,
                    "published_at": c.published_at.strftime("%Y-%m-%d") if c.published_at else None,
                    "created_at": c.created_at.strftime("%Y-%m-%d %H:%M:%S"),
                    "updated_at": c.updated_at.strftime("%Y-%m-%d %H:%M:%S"),
                } for c in new_contents
            ],
        }

        # 转换字段名为 camelCase
        updated_button_data = transform_to_camel_case(updated_button_data)

        logger.info("Updated button data prepared: %s", updated_button_data)
        return Response(updated_button_data)

    except Exception as e:
        logger.error("Failed to fetch updated content: %s", str(e))
        return Response({"error": "获取更新内容失败，请联系管理员"}, status=500)


@api_view(["POST"])
def fetch_content(request):
    try:
        data = request.data
        last_update = data.get("lastUpdate")
        all_buttons = Button.objects.all()

        response_data = []

        for button in all_buttons:
            if last_update:
                new_contents = Content.objects.filter(
                    button=button,
                    created_at__gt=last_update
                )
            else:
                new_contents = Content.objects.filter(button=button)

            response_data.append({
                "button": {"id": button.id, "name": button.name},
                "contents": [
                    {
                        "id": c.id,
                        "name": c.name,
                        "description": c.description,
                        "source": c.source,
                        "published_at": c.published_at.strftime("%Y-%m-%d") if c.published_at else None,
                        "created_at": c.created_at.strftime("%Y-%m-%d %H:%M:%S"),
                        "updated_at": c.updated_at.strftime("%Y-%m-%d %H:%M:%S"),
                    } for c in new_contents
                ],
            })

        # 转换字段名为 camelCase
        response_data = transform_to_camel_case(response_data)
        # 打印给前端的数据
        # print("Returning data to frontend:", response_data)
        return Response(response_data)
    except Exception as e:
        logger.error(f"fetch_content 发生错误: {str(e)}", exc_info=True)
        return Response({"error": "服务器内部错误"}, status=500)

