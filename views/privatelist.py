from django.http import JsonResponse, HttpResponseBadRequest, HttpResponseNotFound
from django.views.decorators.csrf import csrf_exempt
from xiu.models import PrivateList
from django.db.models import Count
import json

@csrf_exempt
def get_privatelists(request, id=None):
    if request.method == 'GET':
        value3 = request.GET.get('value3')
        if value3:
            privatelists = PrivateList.objects.filter(value3=value3)
        else:
            privatelists = PrivateList.objects.all()

        # 统计非空data_set的使用次数
        dataset_usage = (
            privatelists
            .exclude(data_set__isnull=True)
            .exclude(data_set="")
            .values('data_set')
            .annotate(count=Count('data_set'))
            .order_by('-count')
        )
        dataset_usage_list = [
            {'data_set': item['data_set'], 'count': item['count']}
            for item in dataset_usage
        ]

        data = []
        for item in privatelists:
            try:
                wrongs = json.loads(item.wrongs) if item.wrongs else []
            except Exception:
                wrongs = []
            data.append({
                'id': item.id,
                'value3': item.value3,
                'model_name': item.model_name,
                'data_set': item.data_set,
                'Metric': item.Metric,
                'score': item.score,
                'timestamp': item.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
                'total_time': item.total_time,
                'total': item.total,
                'correct': item.correct,
                'wrong': item.wrong,
                'wrongs': wrongs,  # 直接返回为数组
            })
        return JsonResponse(
            {
                'data': data,
                'dataset_usage': dataset_usage_list
            },
            safe=False
        )

    elif request.method == 'DELETE':
        if id:
            try:
                record = PrivateList.objects.get(id=id)
                record.delete()
                return JsonResponse({'message': 'Record deleted successfully'})
            except PrivateList.DoesNotExist:
                return HttpResponseNotFound("Record not found")
        else:
            return HttpResponseBadRequest("ID is required for DELETE")

    else:
        return HttpResponseBadRequest("Unsupported HTTP method")