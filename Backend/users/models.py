from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin

class SiteUserManager(BaseUserManager):
    def create_user(self, username, email, password=None, **extra_fields):
        serializer = SiteUserSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response({
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'two_fa_enabled': user.two_fa_enabled,
                'created_time': user.created_time,
                'profile_URL': user.profile_URL,
                'profile_image': user.profile_image.url if user.profile_image else None,
                'is_staff': user.is_staff,
                'is_active': user.is_active,
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def create_superuser(self, username, email, password=None, **extra_fields):
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_active', True)

        return self.create_user(username, email, password, **extra_fields)
    
    def get_by_natural_key(self, username):
        return self.get(username=username)

class SiteUser(AbstractBaseUser, PermissionsMixin):
    id = models.AutoField(primary_key=True)
    username = models.CharField(max_length=150, unique=True)
    email = models.EmailField(unique=True)
    two_fa_enabled = models.BooleanField(default=False)
    created_time = models.DateTimeField(auto_now_add=True)
    profile_URL = models.URLField(default="https://www.shutterstock.com/image-vector/funny-art-borat-illustration-glasses-600nw-2157502681.jpg")
    profile_image = models.ImageField(upload_to='profile_images/', default='profile_images/default.jpg')  # Add this line
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email']

    objects = SiteUserManager()

    def __str__(self):
        return self.username

class Friend(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('declined', 'Declined')
    ]
    
    requester = models.ForeignKey(
        SiteUser,
        on_delete=models.CASCADE,
        related_name='friend_requests_sent'
    )
    receiver = models.ForeignKey(
        SiteUser,
        on_delete=models.CASCADE,
        related_name='friend_requests_received'
    )
    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default='pending'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('requester', 'receiver')
        constraints = [
            models.CheckConstraint(
                check=~models.Q(requester=models.F('receiver')),
                name='no_self_friend'
            )
        ]

    def accept(self):
        self.status = 'accepted'
        self.save()

    def decline(self):
        self.status = 'declined'
        self.save()