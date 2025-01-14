from rest_framework import serializers
from users.models import SiteUser

class SiteUserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = SiteUser
        fields = ['username', 'nickname', 'email', 'password', 'online_status', 'created_time']

    def create(self, validated_data):
        user = SiteUser(
            username=validated_data['username'],
            nickname=validated_data['nickname'],
            email=validated_data['email'],
            online_status=validated_data.get('online_status', False),
        )
        user.set_password(validated_data['password'])
        user.save()
        return user