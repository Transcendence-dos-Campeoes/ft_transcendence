from django.urls import path
from .consumers import LobbyConsumer

ws_urlpatterns = [
    path('', LobbyConsumer.as_asgi())
]