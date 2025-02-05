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
        if value < 4 or value > 32:
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