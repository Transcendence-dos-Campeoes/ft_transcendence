import json
from channels.generic.websocket import WebsocketConsumer
from asgiref.sync import async_to_sync
from .models import SiteUser

class OnlinePlayersConsumer(WebsocketConsumer):
    def connect(self):
        self.accept()
        async_to_sync(self.channel_layer.group_add)("online_players", self.channel_name)
        self.send_online_players()

    def disconnect(self, close_code):
        async_to_sync(self.channel_layer.group_discard)("online_players", self.channel_name)
        pass

    def send_online_players(self):
        players = SiteUser.objects.filter(online_status=True)
        players_data = [{"username": player.username} for player in players]
        self.send(text_data=json.dumps(players_data))

    def online_players_update(self, event):
        self.send_online_players()