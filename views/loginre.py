from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
import json
from django.shortcuts import render, HttpResponse


def toLogin_view(request):
    return HttpResponse("默认根页面")

@csrf_exempt  # 测试用，生产请用 CSRF
def login_or_register(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            username = data.get('username')
            password = data.get('password')

            # 检查是否存在该用户
            user = User.objects.filter(username=username).first()
            if user:
                # 用户存在，尝试登录
                authenticated_user = authenticate(request, username=username, password=password)
                if authenticated_user:
                    login(request, authenticated_user)
                    return JsonResponse({'status': 'success', 'message': '登录成功'})
                else:
                    return JsonResponse({'status': 'error', 'message': '用户名或密码错误'})
            else:
                # 用户不存在，注册并自动登录
                new_user = User.objects.create_user(username=username, password=password)
                # 注册后需要认证（authenticate）一次，然后login
                authenticated_user = authenticate(request, username=username, password=password)
                if authenticated_user:
                    login(request, authenticated_user)
                    return JsonResponse({'status': 'first_login', 'message': '首次登录成功，已完成注册'})
                else:
                    return JsonResponse({'status': 'error', 'message': '注册后自动登录失败'})
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': f'发生错误: {str(e)}'})
    return JsonResponse({'status': 'error', 'message': '无效的请求方法'})

