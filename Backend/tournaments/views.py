from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.throttling import AnonRateThrottle
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken
from rest_framework_simplejwt.exceptions import TokenError
from django.shortcuts import get_object_or_404
from django.contrib.auth import authenticate
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
import requests

from .models import TournamentPlayer, TournamentMatch, Tournament
from .serializers import TournamentSerializer, TournamentPlayerSerializer
from matches.models import Match

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def create_tournament(request):
    """Create a new tournament"""
    serializer = TournamentSerializer(
        data=request.data,
        context={'request': request}
    )
    if serializer.is_valid():
        tournament = serializer.save()
        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED
        )
    return Response(
        serializer.errors,
        status=status.HTTP_400_BAD_REQUEST
    )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_tournaments(request):
    tournaments = Tournament.objects.filter(
            status='pending'
        )
    serializer = TournamentSerializer(tournaments, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_tournament_player(request, tournament_id):
    try:
        tournament = Tournament.objects.get(id=tournament_id)
    except Tournament.DoesNotExist:
        return Response(
            {'error': 'Tournament not found'},
            status=status.HTTP_404_NOT_FOUND
        )

    serializer = TournamentPlayerSerializer(
        data=request.data,
        context={
            'request': request,
            'tournament': tournament
        }
    )
    
    if serializer.is_valid():
        tournament_player = serializer.save()
        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED
        )
    
    return Response(
        serializer.errors,
        status=status.HTTP_400_BAD_REQUEST
    )