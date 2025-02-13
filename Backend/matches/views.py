from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes, throttle_classes, parser_classes
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django.db.models import Avg, Count, Q
from .models import Match
from users.models import SiteUser
from tournaments.models import Tournament
from .serializers import MatchSerializer

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def getRecentMatches(request):
    try:
        # Get 10 most recent matches
        matches = Match.objects.filter(
            player1__isnull=False,
            player2__isnull=False,
            status__in=['finished', 'cancelled', 'active']
        ).order_by('-created_at')[:10]
        
        # Get 10 most recent tournaments
        tournaments = Tournament.objects.all().order_by('-created_at')[:10]

        # Calculate global statistics
        total_matches = Match.objects.filter(
            player1__isnull=False,
            player2__isnull=False,
            status__in=['finished', 'cancelled', 'active']
        ).count()
        total_tournaments = Tournament.objects.count()
        total_players = SiteUser.objects.count()
        
        # Calculate average scores
        avg_score = Match.objects.filter(status='finished').aggregate(
            avg_p1_score=Avg('player1_score'),
            avg_p2_score=Avg('player2_score')
        )

         # Get most active players
        player_stats = SiteUser.objects.annotate(
            matches_played=Count('matches_as_player1', filter=Q(matches_as_player1__status='finished'), distinct=True) + 
                        Count('matches_as_player2', filter=Q(matches_as_player2__status='finished'), distinct=True),
            tournaments_played=Count('tournament_entries')
        ).order_by('-matches_played')[:5]
        
        data = {
            'recent_matches': matches.values(
                'id',
                'player1__username',
                'player2__username',
                'player1_score',
                'player2_score',
                'created_at',
                'winner__username',
                'status',
            ),
            'tournament_history': tournaments.values(
                'id',
                'name',
                'created_at',
                'status',
                'winner__username'
            ).annotate(
                player_count=Count('players')
            ),
            'overview_stats': {
                'total_matches': total_matches,
                'total_tournaments': total_tournaments,
                'total_players': total_players,
                'average_scores': {
                    'player1': round(avg_score['avg_p1_score'] or 0, 2),
                    'player2': round(avg_score['avg_p2_score'] or 0, 2)
                },
                'top_players': [{
                    'username': player.username,
                    'matches': player.matches_played,
                    'tournaments': player.tournaments_played
                } for player in player_stats]
            }
        }
        
        return Response(data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_400_BAD_REQUEST
        )

