from django.db import models
from django.db.models import Q
from users.models import SiteUser

class Match(models.Model):
    MATCH_STATUS = (
        ('pending', 'Pending'),
        ('active', 'Active'),
        ('finished', 'Finished'),
        ('cancelled', 'Cancelled')
    )

    id = models.AutoField(primary_key=True)
    player1 = models.ForeignKey(SiteUser, on_delete=models.SET_NULL, 
                               related_name='matches_as_player1', null=True, blank=True)
    player2 = models.ForeignKey(SiteUser, on_delete=models.SET_NULL, 
                               related_name='matches_as_player2', null=True, blank=True)
    player1_score = models.IntegerField(default=0)
    player2_score = models.IntegerField(default=0)
    winner = models.ForeignKey(SiteUser, on_delete=models.SET_NULL, 
                              null=True, blank=True, related_name='matches_won')
    status = models.CharField(max_length=20, choices=MATCH_STATUS, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'created_at']),
            models.Index(fields=['player1', 'player2']),
        ]

    @classmethod
    def get_player_matches(cls, user):
        return cls.objects.filter(
            Q(player1=user) | Q(player2=user)
        ).select_related('player1', 'player2', 'winner')

    def __str__(self):
        player1_name = self.player1.username if self.player1 else 'TBD'
        player2_name = self.player2.username if self.player2 else 'TBD'
        return f"Match {self.id}: {player1_name} vs {player2_name}"