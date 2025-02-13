from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django.utils import timezone

from .models import TournamentPlayer, TournamentMatch, Tournament
from .serializers import TournamentSerializer, TournamentPlayerSerializer
from matches.models import Match

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_tournaments(request):
    tournaments = Tournament.objects.all()
    serializer = TournamentSerializer(tournaments, many=True)
    return Response(serializer.data)

@api_view(['POST'])
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

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def start_tournament(request, tournament_id):
    try:
        tournament = Tournament.objects.get(id=tournament_id)
        
        if tournament.creator != request.user:
            return Response(
                {'error': 'Only creator can start tournament'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Get accepted players and validate minimum count
        players = list(tournament.players.filter(status='accepted')
                      .order_by('?')  # Randomize seeding
                      .values_list('player', flat=True))
        
        if len(players) < 4:
            return Response(
                {'error': 'Need at least 4 players to start'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Calculate number of rounds needed
        import math
        num_rounds = math.ceil(math.log2(len(players)))
        total_slots = 2 ** num_rounds

        # Create matches for first round
        first_round_matches = []
        match_number = 1
        for i in range(0, len(players), 2):
            # Create Match
            if i + 1 < len(players):
                match = Match.objects.create(
                    player1_id=players[i],
                    player2_id=players[i + 1],
                    status='pending'
                )
            else:
                # Bye match - player automatically advances
                match = Match.objects.create(
                    player1_id=players[i],
                    player2_id=players[i],  # Same player
                    status='finished',
                    winner_id=players[i]
                )

            tournament_match = TournamentMatch.objects.create(
                tournament=tournament,
                match=match,
                round_number=1,
                match_number=match_number
            )
            first_round_matches.append(tournament_match)
            match_number += 1

        # Create placeholder matches for subsequent rounds
        previous_round_matches = first_round_matches
        for round_num in range(2, num_rounds + 1):
            current_round_matches = []
            matches_in_round = len(previous_round_matches) // 2

            for i in range(matches_in_round):
                # Create empty match as placeholder
                match = Match.objects.create(
                    status='pending'
                )
                tournament_match = TournamentMatch.objects.create(
                    tournament=tournament,
                    match=match,
                    round_number=round_num,
                    match_number=match_number
                )
                match_number += 1
                current_round_matches.append(tournament_match)

                # Link previous round matches to this one
                previous_round_matches[i*2].next_match = tournament_match
                previous_round_matches[i*2].save()
                previous_round_matches[i*2+1].next_match = tournament_match
                previous_round_matches[i*2+1].save()

            previous_round_matches = current_round_matches

        # Update tournament status
        tournament.status = 'active'
        tournament.started_at = timezone.now()
        tournament.save()

        return Response(
            TournamentSerializer(tournament).data,
            status=status.HTTP_200_OK
        )

    except Tournament.DoesNotExist:
        return Response(
            {'error': 'Tournament not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )
    
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_tournament_bracket(request, tournament_id):
    try:
        tournament = Tournament.objects.get(id=tournament_id)
        
        matches = TournamentMatch.objects.filter(
            tournament=tournament
        ).select_related(
            'match',
            'match__player1',
            'match__player2',
            'match__winner',
            'next_match'
        ).order_by('round_number', 'match_number')

        rounds = {}
        for match in matches:
            if match.round_number not in rounds:
                rounds[match.round_number] = []
            
            rounds[match.round_number].append({
                'match_id': match.match.id,
                'round': match.round_number,
                'match_number': match.match_number,
                'player1': match.match.player1.username if match.match.player1 else None,
                'player2': match.match.player2.username if match.match.player2 else None,
                'player1_score': match.match.player1_score,
                'player2_score': match.match.player2_score,
                'winner': match.match.winner.username if match.match.winner else None,
                'status': match.match.status,
                'next_match': match.next_match.match_number if match.next_match else None
            })

        return Response({
            'tournament_id': tournament.id,
            'name': tournament.name,
            'status': tournament.status,
            'rounds': rounds,
            'total_players': tournament.get_player_count(),
            'started_at': tournament.started_at,
            'finished_at': tournament.finished_at,
            'winner': tournament.winner.username if tournament.winner else None
        })

    except Tournament.DoesNotExist:
        return Response(
            {'error': 'Tournament not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )