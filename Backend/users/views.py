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
    request_body=openapi.Schema(
        type=openapi.TYPE_OBJECT,
        properties={
            'username': openapi.Schema(type=openapi.TYPE_STRING, description='The username of the new user', example='testuser'),
            'nickname': openapi.Schema(type=openapi.TYPE_STRING, description='The nickname of the new user', example='Test User'),
            'email': openapi.Schema(type=openapi.TYPE_STRING, description='The email address of the new user', example='example@example.com'),
            'password': openapi.Schema(type=openapi.TYPE_STRING, description='The password for the new user', example='password123'),
        },
        required=['username', 'nickname', 'email', 'password']
    ),
    responses={
        201: openapi.Response('User created successfully', SiteUserSerializer),
        400: 'Bad Request'
    }
)
@api_view(['POST'])
def createUser(request):
    """
    Create a new user.
    """
    serializer = SiteUserSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)