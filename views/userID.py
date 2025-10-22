from django.http import JsonResponse
from django.contrib.auth.decorators import login_required


@login_required
def current_user(request):
    return JsonResponse({
        'id': request.user.id,
        'username': request.user.username,
        # 'password': request.user.password,  # 千万不要返回
    })