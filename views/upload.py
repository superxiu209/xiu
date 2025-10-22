from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
# from xiu.models import ReceivedData  # 导入模型

@csrf_exempt  # 禁用 CSRF 保护，开发环境可这样做，生产环境需更安全的处理方式
def upload_data(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            value1 = data.get('value1')
            value2 = data.get('value2')
            print(f'接收到的数据：value1={value1}, value2={value2}')

            # # 将数据保存到数据库
            # received_data = ReceivedData(value1=value1, value2=value2)
            # received_data.save()
            # 这里可以进行数据的存储、处理等操作
            return JsonResponse({'message': '数据接收成功'}, status=200)
        except json.JSONDecodeError:
            return JsonResponse({'message': '数据解析错误'}, status=400)
    return JsonResponse({'message': '无效的请求方法'}, status=405)