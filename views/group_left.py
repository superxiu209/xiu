from django.http import JsonResponse
from xiu.models import Group


def left_list_data(request):
    group_type = request.GET.get("type")  # 获取前端传入的type参数
    if group_type:
        groups = Group.objects.filter(type=group_type).prefetch_related('options').all()
    else:
        groups = Group.objects.prefetch_related('options').all()
    result = []
    for group in groups:
        result.append({
            "group": group.name,
            "options": [
                {"display": o.display, "value": o.value}
                for o in group.options.all()
            ]
        })
    return JsonResponse(result, safe=False)
