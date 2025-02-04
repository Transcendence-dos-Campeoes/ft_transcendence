from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework import serializers
from .models import Match
from users.models import SiteUser

class MatchSerializer(serializers.ModelSerializer):
    

    class Meta:
        model = Match
        fields = ['id', 'player1', 'player2', 'player1_score', 'player2_score', 'winner', 'status', 'created_at']
        read_only_fields = ['id', 'created_at']

    def validate(self, data):
        player1 = data.get('player1')
        player2 = data.get('player2')

        if not isinstance(player1, SiteUser) or not isinstance(player2, SiteUser):
            raise serializers.ValidationError("player1 and player2 must be instances of SiteUser.")

        if player1 == player2:
            raise serializers.ValidationError("A player cannot play against themselves.")

        return data
