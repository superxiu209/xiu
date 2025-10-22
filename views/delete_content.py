from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.db import transaction
from xiu.models import Button, Content
import logging

# 配置日志
logger = logging.getLogger(__name__)

@api_view(["POST"])
@transaction.atomic
def delete_content(request):
    """
    处理删除内容的 POST 请求，并返回最新的内容数据。
    """
    try:
        # 获取请求数据中的内容 ID
        content_id = request.data.get("id")
        if not content_id:
            return Response({"error": "内容 ID 不能为空"}, status=400)

        # 查询并删除内容
        try:
            content = Content.objects.get(id=content_id)
            content.delete()  # 删除内容
            logger.info(f"内容已删除：{content_id}")
        except Content.DoesNotExist:
            logger.error(f"内容不存在：{content_id}")
            return Response({"error": "内容不存在"}, status=404)

        # 查询并返回最新的内容数据
        all_buttons = Button.objects.all()
        response_data = []

        for button in all_buttons:
            new_contents = Content.objects.filter(button=button)

            # 格式化返回数据
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

        return Response(response_data)

    except Exception as e:
        logger.error(f"删除内容时发生错误：{str(e)}", exc_info=True)
        return Response({"error": "服务器内部错误"}, status=500)