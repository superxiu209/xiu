

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from xiu.models import Button, Content
from xiu.serializers import ButtonSerializer, ContentSerializer


class ButtonListView(APIView):
    def get(self, request):
        buttons = Button.objects.all()
        serializer = ButtonSerializer(buttons, many=True)
        return Response(serializer.data)


class AddContentView(APIView):
    def post(self, request):
        serializer = ContentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)