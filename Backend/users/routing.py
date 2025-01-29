from django.urls import re_path
from .consumers import OnlinePlayersConsumer

ws_urlpatterns = [
    re_path(r'online-players/', OnlinePlayersConsumer.as_asgi())
]