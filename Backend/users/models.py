from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin

class SiteUserManager(BaseUserManager):
    def create_user(self, username, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(username=username, email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

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