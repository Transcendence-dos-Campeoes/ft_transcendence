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
from .consumers import OnlinePlayersConsumer, get_channel_name
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage

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
        user.save()

        channel_layer = get_channel_layer()
        channel_name = get_channel_name(user.username)
        if channel_name:
            async_to_sync(channel_layer.send)(
                channel_name,
                {
                    "type": "close_connection"
                }
            )

        return Response({"detail": "Logout successful"}, status=status.HTTP_205_RESET_CONTENT)
    except TokenError as e:
        if str(e) == "Token is blacklisted":
            return Response({"detail": "Token is already blacklisted"}, status=status.HTTP_205_RESET_CONTENT)
        return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def deleteUser(request):
    try:
        user = request.user
        # Invalidate all user tokens
        OutstandingToken.objects.filter(user=user).delete()
        
        user.delete()
        
        return Response(
            {"detail": "Account deleted successfully"}, 
            status=status.HTTP_204_NO_CONTENT
        )
    except Exception as e:
        return Response(
            {"error": str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def getUserProfile(request):
    try:
        user = request.user
        matches = Match.get_player_matches(user)
        
        # Get tournament stats
        tournament_participations = TournamentPlayer.objects.filter(
            player=user
        ).select_related('tournament')
        
        total_tournaments = tournament_participations.count()
        tournaments_won = tournament_participations.filter(status='winner').count()
        best_position = tournament_participations.filter(
            status__in=['winner', 'eliminated']
        ).order_by('seed').first()
        
        tournament_win_rate = (tournaments_won / total_tournaments * 100) if total_tournaments > 0 else 0

        # Calculate match stats
        total_matches = matches.count()
        wins = matches.filter(winner=user).count()
        losses = total_matches - wins
        win_rate = (wins / total_matches * 100) if total_matches > 0 else 0

        profile_data = {
            'username': user.username,
            'created_time': user.created_time,
            'profile_image': request.build_absolute_uri(user.profile_image.url) if user.profile_image else None,
            'stats': {
                'total_matches': total_matches,
                'wins': wins,
                'losses': losses,
                'win_rate': round(win_rate, 2),
                'tournament_stats': {
                    'total_tournaments': total_tournaments,
                    'tournaments_won': tournaments_won,
                    'best_position': best_position.seed if best_position else None,
                    'tournament_win_rate': round(tournament_win_rate, 2)
                }
            },
            'recent_matches': matches[:5].values(
                'id',
                'player1__username',
                'player2__username',
                'player1_score',
                'player2_score',
                'created_at',
                'winner__username'
            ),
            'tournament_history': [
                {
                    'id': t.tournament.id,
                    'name': t.tournament.name,
                    'date': t.tournament.created_at,
                    'position': t.seed,
                    'status': t.status,
                    'total_players': t.tournament.players.count()
                }
                for t in tournament_participations.order_by('-tournament__created_at')[:5]
            ]
        }
        
        return Response(profile_data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def getFriendProfile(request, username):
    try:
        user = SiteUser.objects.filter(username=username).first()
        if not user:
            return Response({'error': 'User not found'}, status=404)

        matches = Match.get_player_matches(user)
        
        # Get tournament stats
        tournament_participations = TournamentPlayer.objects.filter(
            player=user
        ).select_related('tournament')
        
        total_tournaments = tournament_participations.count()
        tournaments_won = tournament_participations.filter(status='winner').count()
        best_position = tournament_participations.filter(
            status__in=['winner', 'eliminated']
        ).order_by('seed').first()
        
        tournament_win_rate = (tournaments_won / total_tournaments * 100) if total_tournaments > 0 else 0

        # Calculate match stats
        total_matches = matches.count()
        wins = matches.filter(winner=user).count()
        losses = total_matches - wins
        win_rate = (wins / total_matches * 100) if total_matches > 0 else 0

        profile_data = {
            'username': user.username,
            'created_time': user.created_time,
            'profile_image': request.build_absolute_uri(user.profile_image.url) if user.profile_image else None,
            'stats': {
                'total_matches': total_matches,
                'wins': wins,
                'losses': losses,
                'win_rate': round(win_rate, 2),
                'tournament_stats': {
                    'total_tournaments': total_tournaments,
                    'tournaments_won': tournaments_won,
                    'best_position': best_position.seed if best_position else None,
                    'tournament_win_rate': round(tournament_win_rate, 2)
                }
            },
            'recent_matches': matches[:5].values(
                'id',
                'player1__username',
                'player2__username',
                'player1_score',
                'player2_score',
                'created_at',
                'winner__username'
            ),
            'tournament_history': [
                {
                    'id': t.tournament.id,
                    'name': t.tournament.name,
                    'date': t.tournament.created_at,
                    'position': t.seed,
                    'status': t.status,
                    'total_players': t.tournament.players.count()
                }
                for t in tournament_participations.order_by('-tournament__created_at')[:5]
            ]
        }
        
        return Response(profile_data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def getUserSettings(request):
    try:
        user = request.user

        settings_data = {
            'username': user.username,
            'email': user.email,
            'two_fa_enabled': user.two_fa_enabled,
            'created_time': user.created_time,
            'profile_image': request.build_absolute_uri(user.profile_image.url) if user.profile_image else None,
        }
        return Response(settings_data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def updateUserProfile(request):
    try:
        user = request.user
        serializer = SiteUserSerializer(user, data=request.data, partial=True)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def updateUserPassword(request):
    try:
        user = request.user
        data = request.data

        # Check current password
        if not user.check_password(data['currPassword']):
            return Response(
                {'error': 'Current password is incorrect'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if new passwords match
        if data['newPassword'] != data['confPassword']:
            return Response(
                {'error': 'New passwords do not match'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Update password
        user.set_password(data['newPassword'])
        user.save()

        return Response(
            {'message': 'Password updated successfully'},
            status=status.HTTP_200_OK
        )

    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def getFriends(request):
    friend_requests = Friend.objects.filter(
        (Q(receiver=request.user) | Q(requester=request.user)) &
        Q(status='accepted')
    )
    friends_list = []
    for friendship in friend_requests:
        friend = friendship.receiver if friendship.requester == request.user else friendship.requester
        friends_list.append({
            'id': friend.id,
            'username': friend.username
        })
    return Response(friends_list)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def getInvites(request):
    friend_requests = Friend.objects.filter(
            receiver=request.user,
            status='pending'
        )
    serializer = FriendRequestSerializer(friend_requests, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def createInvite(request):
    serializer = FriendRequestSerializer(
        data=request.data,
        context={'request': request}
    )
    if serializer.is_valid():
        serializer.save()
        return Response({
            'friend': serializer.data
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def changeStatusInvite(request):
    """Accept/Decline friend request"""
    friend_request = get_object_or_404(Friend, id=request.data.get("friend_request_id"), receiver=request.user)
    action = request.data.get('action')

    if action == 'accept':
        friend_request.accept()
    elif action == 'decline':
        friend_request.decline()
    else:
        return Response(
            {'error': 'Invalid action'},
            status=status.HTTP_400_BAD_REQUEST
        )

    serializer = FriendRequestSerializer(friend_request)
    return Response(serializer.data)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def deleteFriend(request, friend_id):
    """Delete friendship between users"""
    # Find friendship in either direction
    friendship = Friend.objects.filter(
        (Q(requester=request.user, receiver_id=friend_id) |
         Q(receiver=request.user, requester_id=friend_id)) &
        Q(status='accepted')
    ).first()

    if not friendship:
        return Response(
            {'error': 'Friendship not found'},
            status=status.HTTP_404_NOT_FOUND
        )

    friendship.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(['POST'])
@permission_classes([])
def oauth_callback(request):
    try:
        code = request.data.get('code')
        if not code:
            return Response({'error': 'Authorization code is missing'}, status=status.HTTP_400_BAD_REQUEST)

        # Exchange authorization code for access token
        token_url = 'https://api.intra.42.fr/oauth/token'
        data = {
            'grant_type': 'authorization_code',
            'client_id': 'u-s4t2ud-a6f40a3d8815d6e54ce1c1ade89e13948ac4e875a56a593543068f6a77e7ddc4',
            'client_secret': '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',
            'code': code,
            'redirect_uri': 'https://localhost/42'
        }
        response = requests.post(token_url, data=data)
        if response.status_code != 200:
            return Response({'error': 'Failed to obtain access token'}, status=status.HTTP_400_BAD_REQUEST)

        token_data = response.json()
        access_token = token_data['access_token']

        # Use access token to get user info
        user_info_url = 'https://api.intra.42.fr/v2/me'
        headers = {'Authorization': f'Bearer {access_token}'}
        user_info_response = requests.get(user_info_url, headers=headers)
        if user_info_response.status_code != 200:
            return Response({'error': 'Failed to obtain user info'}, status=status.HTTP_400_BAD_REQUEST)

        user_info = user_info_response.json()
        username = user_info['login']
        email = user_info['email']
        photo_URL = user_info['image']['link']  # Correctly extract the photo URL

        # Download the image
        image_response = requests.get(photo_URL)
        if image_response.status_code != 200:
            return Response({'error': 'Failed to download profile image'}, status=status.HTTP_400_BAD_REQUEST)

        # Create or authenticate user
        user, created = SiteUser.objects.get_or_create(username=username, defaults={'email': email})
        if created:
            user.set_unusable_password()
            image_name = f"{username}.jpg"
            user.profile_image.save(image_name, ContentFile(image_response.content))
            user.save()
            print(f"User {username} created with an unusable password.")
        else:
            user.email = email
            user.save()

        refresh = RefreshToken.for_user(user)
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'username': username,
            'email': user.email,
            'profile_image': request.build_absolute_uri(user.profile_image.url),
            'all_info': user_info,
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
