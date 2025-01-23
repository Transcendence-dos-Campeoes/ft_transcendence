from rest_framework.response import Response
from rest_framework.decorators import api_view, throttle_classes
from rest_framework import status
from .serializers import SiteUserSerializer
from .models import SiteUser, SiteUserManager
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from rest_framework.throttling import AnonRateThrottle

class RegisterUserThrottle(AnonRateThrottle):
    rate = '4/hour'  # Custom throttle rate for user registration

from django.contrib.auth import authenticate
from rest_framework.authtoken.models import Token
from django.shortcuts import get_object_or_404

from rest_framework.decorators import authentication_classes, permission_classes
from rest_framework.authentication import SessionAuthentication, TokenAuthentication
from rest_framework.permissions import IsAuthenticated


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
@throttle_classes([RegisterUserThrottle])
def create_user(request):
    """
    Create a new user.
    """
    serializer = SiteUserSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        token = Token.objects.get(username=request.data['username'])
        return Response({"token": token, "user": serializer.data}, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
def loginUser(request):
    """
    Log in a user.
    """

    print(f"Username: {request.data['username']}")
    user = get_object_or_404(SiteUser, username = request.data['username'])
    
    if not user.check_password(request.data['password']):
        return Response({'detail': 'Not found.'}, status=status.HTTP_400_BAD_REQUEST)
    
    token, created = Token.objects.get_or_create(user = user)
    serializer = SiteUserSerializer(instance=user)
    return Response({"token": token.key, "user": serializer.data}, status=status.HTTP_200_OK)

@api_view(['GET'])
@authentication_classes([SessionAuthentication, TokenAuthentication])
@permission_classes([IsAuthenticated])
def test_token(request):
    return Response("passed for {}".format(request.user.email))
