from rest_framework.response import Response
from rest_framework.decorators import api_view
from rest_framework import status
from .serializers import SiteUserSerializer
from .models import SiteUser
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

@api_view(['GET'])
def getUsersData(request):
    """
    Retrieve a list of all users.
    """
    SiteUsers = SiteUser.objects.all()
    serializer = SiteUserSerializer(SiteUsers, many=True)
    return Response(serializer.data)

@swagger_auto_schema(
    method='post',
    request_body=SiteUserSerializer,
    responses={
        201: openapi.Response('User created successfully', SiteUserSerializer),
        400: 'Bad Request'
    }
)
@api_view(['POST'])
def create_user(request):
    """
    Create a new user.
    """
    serializer = SiteUserSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)