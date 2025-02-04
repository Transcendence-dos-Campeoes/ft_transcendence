from django.urls import path
from . import views

urlpatterns = [
     path('get/', views.getRecentMatches, name='get-recent-matches')
]
