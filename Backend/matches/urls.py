from django.urls import path
from . import views

urlpatterns = [
     path('create/', views.MatchCreateView.as_view(), name='match-create'),
]
