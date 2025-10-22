from django.views.decorators.csrf import csrf_exempt
from xiu.models import Receives, FileScores
from django.http import JsonResponse, HttpResponseBadRequest, HttpResponseNotFound


@csrf_exempt
def get_file_scores(request, receive_id):
    if request.method == 'GET':
        try:
            receive = Receives.objects.get(id=receive_id)
        except Receives.DoesNotExist:
            return HttpResponseNotFound("Receive not found")
        file_scores = FileScores.objects.filter(receive_id=receive_id)
        data = [
            {
                "id": fs.id,
                "file_path": fs.file_path,
                "valid_scores": fs.valid_scores,
            }
            for fs in file_scores
        ]
        return JsonResponse(data, safe=False)
    else:
        return HttpResponseBadRequest("Unsupported HTTP method")