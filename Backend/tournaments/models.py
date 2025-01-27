from django.db import models
from django.db.models import Q
from users.models import SiteUser
from matches.models import Match

class Tournament(models.Model):
    TOURNAMENT_STATUS = (
        ('pending', 'Pending'),
        ('active', 'Active'),
        ('finished', 'Finished'),
        ('cancelled', 'Cancelled')
    )

    name = models.CharField(max_length=100)
    creator = models.ForeignKey(SiteUser, on_delete=models.CASCADE, related_name='tournaments_created')
    status = models.CharField(max_length=20, choices=TOURNAMENT_STATUS, default='pending')
    max_players = models.IntegerField(default=8)
    created_at = models.DateTimeField(auto_now_add=True)
    started_at = models.DateTimeField(null=True, blank=True)
    finished_at = models.DateTimeField(null=True, blank=True)
    winner = models.ForeignKey(SiteUser, on_delete=models.SET_NULL, null=True, related_name='tournaments_won')

    class Meta:
        ordering = ['-created_at']

class TournamentPlayer(models.Model):
    PLAYER_STATUS = (
        ('invited', 'Invited'),
        ('accepted', 'Accepted'),
        ('declined', 'Declined'),
        ('eliminated', 'Eliminated'),
        ('winner', 'Winner')
    )

    tournament = models.ForeignKey(Tournament, on_delete=models.CASCADE, related_name='players')
    player = models.ForeignKey(SiteUser, on_delete=models.CASCADE, related_name='tournament_entries')
    status = models.CharField(max_length=20, choices=PLAYER_STATUS, default='invited')
    seed = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['tournament', 'player']

class TournamentMatch(models.Model):
    tournament = models.ForeignKey(Tournament, on_delete=models.CASCADE, related_name='matches')
    match = models.OneToOneField('matches.Match', on_delete=models.CASCADE)
    round_number = models.IntegerField()
    match_number = models.IntegerField()
    next_match = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, related_name='previous_matches')

    class Meta:
        ordering = ['round_number', 'match_number']
