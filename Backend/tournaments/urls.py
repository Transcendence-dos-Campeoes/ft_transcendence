from django.urls import path
from . import views

urlpatterns = [
    path('get/', views.get_tournaments, name='get_tournaments'),
    path('create/', views.create_tournament, name='create_tournament'),
    path('<int:tournament_id>/join/', views.create_tournament_player, name='create_tournament_player'),
    path('<int:tournament_id>/start/', views.start_tournament, name='start_tournament'),
]