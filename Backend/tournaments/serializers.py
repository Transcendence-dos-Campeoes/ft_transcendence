from rest_framework import serializers
from .models import Tournament, TournamentPlayer, TournamentMatch
from matches.models import Match
from django.utils import timezone

class TournamentSerializer(serializers.ModelSerializer):
    tournamentName = serializers.CharField(source='name')
    maxPlayers = serializers.IntegerField(source='max_players')
    creator = serializers.CharField(source='creator.username', read_only=True)
    currentPlayers = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = Tournament
        fields = ['id', 'creator', 'tournamentName', 'maxPlayers', 'status', 'created_at', 'currentPlayers']
        read_only_fields = ['id', 'status', 'created_at', 'creator', 'currentPlayers']

    def get_currentPlayers(self, obj):
        return TournamentPlayer.objects.filter(tournament=obj).count()

    def validate_maxPlayers(self, value):
        if value < 4 or value > 24:
            raise serializers.ValidationError("Number of players must be between 4 and 24")
        return value

    def create(self, validated_data):
        request = self.context.get('request')
        tournament = Tournament.objects.create(
            name=validated_data['name'],
            max_players=validated_data['max_players'],
            creator=request.user,
            status='pending'
        )
        return tournament

class TournamentPlayerSerializer(serializers.ModelSerializer):
    class Meta:
        model = TournamentPlayer
        fields = ['id', 'player', 'status', 'seed']  # Remove tournament from fields
        read_only_fields = ['id', 'player', 'seed']

    def validate(self, data):
        tournament = self.context.get('tournament')
        if not tournament:
            raise serializers.ValidationError("Tournament not found")
        
        # Check if tournament is full
        current_players = TournamentPlayer.objects.filter(tournament=tournament).count()
        if current_players >= tournament.max_players:
            raise serializers.ValidationError("Tournament is full")
        
        # Check if player already joined
        request = self.context.get('request')
        if TournamentPlayer.objects.filter(tournament=tournament, player=request.user).exists():
            raise serializers.ValidationError("Already joined this tournament")
        
        # Check if tournament is still pending
        if tournament.status != 'pending':
            raise serializers.ValidationError("Cannot join tournament - wrong status")
        
        return data

    def create(self, validated_data):
        request = self.context.get('request')
        tournament = self.context.get('tournament')
        
        tournament_player = TournamentPlayer.objects.create(
            tournament=tournament,
            player=request.user,
            status='accepted'
        )
        return tournament_player
    
class StartTournamentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tournament
        fields = ['id', 'status']
        read_only_fields = ['id']

    def validate(self, data):
        tournament = self.instance
        if tournament.status != 'pending':
            raise serializers.ValidationError("Tournament already started")
        
        players_count = tournament.players.filter(status='accepted').count()
        if players_count < 4:
            raise serializers.ValidationError("Need at least 4 players")
            
        data['status'] = 'active'
        return data

    def create_bracket(self, tournament):
        players = list(tournament.players.filter(status='accepted'))
        import random
        random.shuffle(players)
        
        # Update seeds
        for i, player in enumerate(players):
            player.seed = i + 1
            player.save()
            
        round_number = 1
        match_number = 1
        matches = []

        # Create first round matches
        for i in range(0, len(players), 2):
            if i + 1 < len(players):
                match = Match.objects.create(
                    player1=players[i].player,
                    player2=players[i+1].player,
                    status='pending'
                )
                tournament_match = TournamentMatch.objects.create(
                    tournament=tournament,
                    match=match,
                    round_number=round_number,
                    match_number=match_number
                )
                matches.append(tournament_match)
                match_number += 1

        # Link matches for next rounds
        while len(matches) > 1:
            next_round = []
            for i in range(0, len(matches), 2):
                if i + 1 < len(matches):
                    # Create match with temporary players (will be updated when previous matches finish)
                    match = Match.objects.create(
                        player1=players[0].player,  # Temporary player
                        player2=players[1].player,  # Temporary player
                        status='pending'
                    )
                    next_match = TournamentMatch.objects.create(
                        tournament=tournament,
                        match=match,
                        round_number=round_number + 1,
                        match_number=match_number
                    )
                    matches[i].next_match = next_match
                    matches[i+1].next_match = next_match
                    matches[i].save()
                    matches[i+1].save()
                    next_round.append(next_match)
                    match_number += 1
            matches = next_round
            round_number += 1

    def update(self, instance, validated_data):
        # Create bracket before changing status
        self.create_bracket(instance)
        # Update tournament status
        instance.status = validated_data.get('status', instance.status)
        instance.started_at = timezone.now()
        instance.save()
        return instance