from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes, throttle_classes, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.throttling import AnonRateThrottle
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken
from .serializers import SiteUserSerializer, MyTokenObtainPairSerializer, FriendRequestSerializer
from .models import SiteUser, Friend
from matches.models import Match
from tournaments.models import TournamentPlayer
from django.shortcuts import get_object_or_404
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from rest_framework_simplejwt.exceptions import TokenError
from django.contrib.auth import authenticate
from django.db.models import Q
import requests
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import Match
from .serializers import MatchSerializer


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def MatchCreateView(request):
    serializer = MatchSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)