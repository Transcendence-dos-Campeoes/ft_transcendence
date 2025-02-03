from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken

from rest_framework import serializers
from .models import Match
from users.models import SiteUser

class MatchSerializer(serializers.ModelSerializer):
    
    player1 = serializers.CharField(write_only=True)
    player2 = serializers.CharField(write_only=True)
    player1_instance = serializers.PrimaryKeyRelatedField(read_only=True)
    player2_instance = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Match
        fields = ['id', 'player1', 'player2', 'player1_instance', 'player2_instance', 'player1_score', 'player2_score', 'winner', 'status', 'created_at']
        read_only_fields = ['id', 'created_at', 'player1_instance', 'player2_instance']

    def validate(self, data):
        player1_username = data.get('player1')
        player2_username = data.get('player2')

        if player1_username == player2_username:
            raise serializers.ValidationError("A player cannot play against themselves.")

        try:
            player1 = SiteUser.objects.get(username=player1_username)
            print(player1)
        except SiteUser.DoesNotExist:
            raise serializers.ValidationError(f"Player1 with username '{player1_username}' does not exist.")

        try:
            player2 = SiteUser.objects.get(username=player2_username)
            print(player2)
        except SiteUser.DoesNotExist:
            raise serializers.ValidationError(f"Player2 with username '{player2_username}' does not exist.")

        data['player1_instance'] = player1
        data['player2_instance'] = player2
        data['player1'] = player1.id
        data['player2'] = player2.id

        return data

    def create(self, validated_data):
        player1 = validated_data.pop('player1_instance')
        player2 = validated_data.pop('player2_instance')
        validated_data.pop('player1')
        validated_data.pop('player2')
        match = Match.objects.create(player1=player1, player2=player2, **validated_data)
        return match