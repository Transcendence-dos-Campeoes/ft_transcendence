from django.urls import path
from .consumers import PongConsumer

ws_urlpatterns = [
    path('online-players/', PongConsumer.as_asgi())
]