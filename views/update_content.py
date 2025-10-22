from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.db import transaction
from xiu.models import Content, Button
import logging

logger = logging.getLogger(__name__)

@api_view(["POST"])
@transaction.atomic
def update_content(request):
    """
    处理内容修改的 POST 请求，并返回最新的内容数据。
    """
    try:
        content_id = request.data.get("id")
        if not content_id:
            return Response({"error": "内容 ID 不能为空"}, status=400)

        try:
            content = Content.objects.get(id=content_id)
        except Content.DoesNotExist:
            return Response({"error": "内容不存在"}, status=404)

        # 更新内容字段
        content.name = request.data.get("name", content.name)
        content.description = request.data.get("description", content.description)
        content.source = request.data.get("source", content.source)
        content.published_at = request.data.get("publishedAt", content.published_at)
        content.save()

        # 查询并返回最新的内容数据
        all_buttons = Button.objects.all()
        response_data = []

        for button in all_buttons:
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

        return Response({"message": "内容修改成功", "data": response_data})

    except Exception as e:
        logger.error(f"修改内容时发生错误：{str(e)}", exc_info=True)
        return Response({"error": "服务器内部错误"}, status=500)