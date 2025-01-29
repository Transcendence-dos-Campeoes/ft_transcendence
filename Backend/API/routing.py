from django.urls import re_path
from channels.routing import URLRouter
import Pong.routing
import users.routing


ws_urlpatterns = [
    re_path(r"ws/users/", URLRouter(users.routing.ws_urlpatterns)),
    re_path(r"ws/Pong/", URLRouter(Pong.routing.ws_urlpatterns)),
]   