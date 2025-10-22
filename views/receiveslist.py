from django.views.decorators.csrf import csrf_exempt
from xiu.models import Receives
from django.http import JsonResponse, HttpResponseBadRequest, HttpResponseNotFound
import json


@csrf_exempt
def get_receives(request, id=None):  # 新增 id 参数
    if request.method == 'GET':
        # 查询所有数据
        receives = Receives.objects.all()
        data = [
            {
                'id': item.id,  # 数据库真实 ID
                'value1': item.value1,
                'value2': item.value2,
                'average_score': item.average_score,
                # 'score': item.score,
                # 'timestamp': item.timestamp.strftime('%Y-%m-%d %H:%M:%S')
            }
            for item in receives
        ]
        return JsonResponse(data, safe=False)

    elif request.method == 'DELETE':
        if id:  # 检查 id 是否存在
            try:
                record = Receives.objects.get(id=id)
                record.delete()
                return JsonResponse({'message': 'Record deleted successfully'})
            except Receives.DoesNotExist:
                return HttpResponseNotFound("Record not found")
        else:
            return HttpResponseBadRequest("ID is required for DELETE")

    else:
        return HttpResponseBadRequest("Unsupported HTTP method")