from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from .models import SiteUser

class SiteUserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = SiteUser
        fields = ['username', 'email', 'password', 'online_status', 'created_time']

    def validate_password(self, value):
        validate_password(value, self.instance)
        return value

    def create(self, validated_data):
        user = SiteUser(
            username=validated_data['username'],
            email=validated_data['email'],
            online_status=validated_data.get('online_status', False),
        )
        user.set_password(validated_data['password'])
        user.save()
        return user