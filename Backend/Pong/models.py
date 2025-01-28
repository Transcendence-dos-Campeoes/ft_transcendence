from django.db import models

# Create your models here.

class Lobby(models.Model):
    name = models.CharField(max_length=100, unique=True)
    max_players = models.IntegerField(default=2)
    current_players = models.IntegerField(default=0)
    is_active = models.BooleanField(default=False)