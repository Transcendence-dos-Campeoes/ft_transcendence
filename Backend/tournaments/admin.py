from django.contrib import admin
from .models import Tournament, TournamentMatch, TournamentPlayer

# Register your models here.
admin.site.register(Tournament)
admin.site.register(TournamentMatch)
admin.site.register(TournamentPlayer)
