from rest_framework.response import Response
from rest_framework.decorators import api_view
from rest_framework import status
from .serializers import SiteUserSerializer
from users.models import SiteUser

@api_view(['GET'])
def getData(request):
	SiteUsers = SiteUser.objects.all()
	serializer = SiteUserSerializer(SiteUsers, many=True)
	return Response(serializer.data)

@api_view(['POST'])
def createUser(request):
	serializer = SiteUserSerializer(data=request.data)
	if serializer.is_valid():
		serializer.save()
		return Response(serializer.data, status=status.HTTP_201_CREATED)
	return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)