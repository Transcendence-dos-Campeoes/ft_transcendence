from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from .models import SiteUser, Friend
from rest_framework_simplejwt.tokens import RefreshToken
from django.db.models import Q


class SiteUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = SiteUser
        fields = ['id', 'username', 'email', 'password', 'two_fa_enabled', 'created_time', 'profile_image', 'is_staff', 'is_active']
        read_only_fields = ['id', 'created_time', 'is_staff', 'is_active']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = SiteUser(
            username=validated_data['username'],
            email=validated_data['email']
        )
        user.set_password(validated_data['password'])
        user.save()
        return user

    def validate_password(self, value):
        if len(value) < 8:
            raise serializers.ValidationError("Password must be at least 8 characters long")
        if not any(char.isdigit() for char in value):
            raise serializers.ValidationError("Password must contain at least one digit")
        if not any(char.isalpha() for char in value):
            raise serializers.ValidationError("Password must contain at least one letter")
        return value

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = 'username'

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        token['username'] = user.username
        token['email'] = user.email
        return token

    def validate(self, attrs):
        username = attrs.get('username')
        password = attrs.get('password')

        user = authenticate(username=username, password=password)

        if user is None:
            raise serializers.ValidationError('Invalid username or password')

        user.save()
        
        refresh = self.get_token(user)
        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'username': user.username,
            'email': user.email,
        }
    

class FriendRequestSerializer(serializers.ModelSerializer):
    requester = serializers.PrimaryKeyRelatedField(source='requester.username', read_only=True)
    receiver = serializers.CharField()
    status = serializers.CharField(read_only=True)
    
    class Meta:
        model = Friend
        fields = ['id', 'requester', 'receiver', 'status', 'created_at']

    def validate_receiver(self, value):
        try:
            receiver = SiteUser.objects.get(username=value)
        except SiteUser.DoesNotExist:
            raise serializers.ValidationError("User not found")

        requester = self.context['request'].user
        if receiver == requester:
            raise serializers.ValidationError("Cannot send friend request to yourself")
        
        existing_request = Friend.objects.filter(
            requester=requester, 
            receiver=receiver
        ).exists()
        
        if existing_request:
            raise serializers.ValidationError("Friend request already exists")
        
        return value

    def create(self, validated_data):
        receiver_username = validated_data.pop('receiver')
        receiver = SiteUser.objects.get(username=receiver_username)
        validated_data['receiver'] = receiver
        validated_data['requester'] = self.context['request'].user
        validated_data['status'] = 'pending'
        return super().create(validated_data)

class FriendsSerializer(serializers.ModelSerializer):
    friends = serializers.SerializerMethodField()

    class Meta:
        model = SiteUser
        fields = ['id', 'username', 'friends']

    def get_friends(self, obj):
        friends = Friend.objects.filter(
            (Q(requester=obj) & Q(status='accepted')) | 
            (Q(receiver=obj) & Q(status='accepted'))
        )
        return [{'id': friend.id, 'username': friend.receiver.username if friend.requester == obj else friend.requester.username} for friend in friends]