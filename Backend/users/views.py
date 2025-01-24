from rest_framework.response import Response
from rest_framework.decorators import api_view, throttle_classes, permission_classes
from rest_framework import status
from .serializers import SiteUserSerializer
from .models import SiteUser
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from rest_framework.throttling import AnonRateThrottle
from rest_framework.permissions import IsAuthenticated, IsAdminUser

class RegisterUserThrottle(AnonRateThrottle):
    rate = '4/hour'  # Custom throttle rate for user registration

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
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
@permission_classes([])
@throttle_classes([RegisterUserThrottle])
def create_user(request):
    """
    Create a new user.
    """
    serializer = SiteUserSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)