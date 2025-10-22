from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from xiu.models import User
import json


@csrf_exempt
def information(request):
    if request.method == 'GET':
        email = request.GET.get('email')
        if not email:
            return JsonResponse({"error": "缺少 email 参数"}, status=400)
        user = User.objects.filter(email=email).first()
        if not user:
            return JsonResponse({"error": "用户不存在"}, status=404)
        gender_display = "男" if user.gender == "male" else "女"
        user_data = {
            "id": user.id,
            "name": user.name,
            "gender": user.gender,
            "gender_display": gender_display,
            "age": user.age,
            "phone": user.phone,
            "email": user.email,
            "password": "******"  # 不返回真实密码
        }
        return JsonResponse({"user": user_data}, status=200)

    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            # 校验
            if not data.get('name', '').strip():
                return JsonResponse({"error": "姓名不能为空"}, status=400)
            if data['gender'] not in ['male', 'female']:
                return JsonResponse({"error": "性别字段必须为 'male' 或 'female'"}, status=400)
            # 查询或创建
            user = User.objects.filter(email=data['email']).first()
            if user:
                user.name = data.get('name', user.name)
                user.gender = data.get('gender', user.gender)
                user.age = data.get('age', user.age)
                user.phone = data.get('phone', user.phone)
                user.save()
                gender_display = "男" if user.gender == "male" else "女"
                updated_user = {
                    "id": user.id,
                    "name": user.name,
                    "gender": user.gender,
                    "gender_display": gender_display,
                    "age": user.age,
                    "phone": user.phone,
                    "email": user.email,
                    "password": "******"
                }
                return JsonResponse({"updatedUser": updated_user}, status=200)
            else:
                new_user = User.objects.create(
                    name=data['name'],
                    gender=data['gender'],
                    age=data['age'],
                    phone=data['phone'],
                    email=data['email'],
                    password=data['password']
                )
                gender_display = "男" if new_user.gender == "male" else "女"
                new_user_data = {
                    "id": new_user.id,
                    "name": new_user.name,
                    "gender": new_user.gender,
                    "gender_display": gender_display,
                    "age": new_user.age,
                    "phone": new_user.phone,
                    "email": new_user.email,
                    "password": "******"
                }
                return JsonResponse({"updatedUser": new_user_data}, status=201)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"error": "Invalid request method"}, status=405)