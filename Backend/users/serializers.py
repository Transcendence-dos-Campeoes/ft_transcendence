from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from .models import SiteUser
from .models import Friend
from rest_framework_simplejwt.tokens import RefreshToken


class SiteUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = SiteUser
        fields = '__all__'
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
        # Add custom password validation if needed
        if len(value) < 8:
            raise serializers.ValidationError("Password must be at least 8 characters long.")
        return value

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = 'username'

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Add custom claims
        token['username'] = user.username
        token['email'] = user.email
        token['is_staff'] = user.is_staff
        return token

    def validate(self, attrs):
        username = attrs.get('username')
        password = attrs.get('password')

        user = authenticate(username=username, password=password)

        if user is None:
            raise serializers.ValidationError('Invalid username or password')

        user.online_status = True
        user.save()
        
        refresh = self.get_token(user)
        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'username': user.username,
            'email': user.email,
            'is_staff': user.is_staff,
        }
    

class FriendRequestSerializer(serializers.ModelSerializer):
    requester = serializers.PrimaryKeyRelatedField(read_only=True)
    receiver = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())
    status = serializers.CharField(read_only=True)
    
    class Meta:
        model = Friend
        fields = ['id', 'requester', 'receiver', 'status', 'created_at']

    def validate_receiver(self, value):
        requester = self.context['request'].user
        if value == requester:
            raise serializers.ValidationError("Cannot send friend request to yourself")
        
        existing_request = Friend.objects.filter(
            requester=requester, 
            receiver=value
        ).exists()
        
        if existing_request:
            raise serializers.ValidationError("Friend request already exists")
        
        return value

    def create(self, validated_data):
        validated_data['requester'] = self.context['request'].user
        validated_data['status'] = 'pending'
        return super().create(validated_data)