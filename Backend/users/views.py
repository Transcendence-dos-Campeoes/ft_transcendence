from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.throttling import AnonRateThrottle
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken
from .serializers import SiteUserSerializer, MyTokenObtainPairSerializer, FriendRequestSerializer
from .models import SiteUser, Friend
from matches.models import Match
from django.shortcuts import get_object_or_404
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from rest_framework_simplejwt.exceptions import TokenError
from django.contrib.auth import authenticate
from django.db.models import Q

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
    
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def getUserProfile(request):
    try:
        user = request.user
        matches = Match.get_player_matches(user)
        
        # Calculate stats
        total_matches = matches.count()
        wins = matches.filter(winner=user).count()
        losses = total_matches - wins
        win_rate = (wins / total_matches * 100) if total_matches > 0 else 0

        profile_data = {
            'username': user.username,
            'email': user.email,
            'two_fa_enabled': user.two_fa_enabled,
            'created_time': user.created_time,
            'stats': {
                'total_matches': total_matches,
                'wins': wins,
                'losses': losses,
                'win_rate': round(win_rate, 2)
            },
            'recent_matches': matches[:5].values(
                'id',
                'player1__username',
                'player2__username',
                'player1_score',
                'player2_score',
                'created_at',
                'winner__username'
            )
        }
        
        return Response(profile_data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def updateUserProfile(request):
    try:
        user = request.user
        data = request.data

        # Update username if provided
        if 'username' in data:
            user.username = data['username']

        # Update email if provided
        if 'email' in data:
            user.email = data['email']
        
        # Update 2FA status if provided
        if 'two_factor_enabled' in data:
            user.two_fa_enabled = data['two_factor_enabled']
        
        user.save()

        # Return updated profile data
        return Response({
            'username': user.username,
            'email': user.email,
            'two_factor_enabled': user.two_fa_enabled
        }, status=status.HTTP_200_OK)

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