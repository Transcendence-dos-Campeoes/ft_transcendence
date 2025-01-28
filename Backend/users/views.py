from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.throttling import AnonRateThrottle
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken
from .serializers import SiteUserSerializer, MyTokenObtainPairSerializer
from .models import SiteUser
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from rest_framework_simplejwt.exceptions import TokenError
from django.contrib.auth import authenticate

class RegisterUserThrottle(AnonRateThrottle):
    rate = '200000/hour'  # Custom throttle rate for user registration

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
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': serializer.data
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer

@api_view(['POST'])
@permission_classes([])
def loginUser(request):
    username = request.data.get('username')
    password = request.data.get('password')
    user = authenticate(username=username, password=password)
    if user is not None:
        refresh = RefreshToken.for_user(user)
        user.online_status = True
        user.save()
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        })
    else:
        return Response({'error': 'Invalid credentials'}, status=400)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logoutUser(request):
    try:
        refresh_token = request.data["refresh"]
        token = RefreshToken(refresh_token)
        token.blacklist()

        user = request.user
        user.online_status = False
        user.save()

        return Response({"detail": "Logout successful"}, status=status.HTTP_205_RESET_CONTENT)
    except TokenError as e:
        if str(e) == "Token is blacklisted":
            return Response({"detail": "Token is already blacklisted"}, status=status.HTTP_205_RESET_CONTENT)
        return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)