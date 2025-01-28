import json
from channels.generic.websocket import WebsocketConsumer
from asgiref.sync import async_to_sync
from .models import SiteUser

class OnlinePlayersConsumer(WebsocketConsumer):
    def connect(self):
        self.accept()
        async_to_sync(self.channel_layer.group_add)("online_players", self.channel_name)
        print("CONNECTED: ", self.channel_name)
        self.send_online_players()
        self.broadcast_online_players()

    def disconnect(self, close_code):
        async_to_sync(self.channel_layer.group_discard)("online_players", self.channel_name)
        self.broadcast_online_players()

    def receive(self, text_data):
        data = json.loads(text_data)
        if data['type'] == 'invite':
            self.handle_invite(data)

    def handle_invite(self, data):
        async_to_sync(self.channel_layer.group_send)(
            "online_players",
            {
                "type": "invite",
                "from": data['from'],
                "to": data['to']
            }
        )

    def send_online_players(self):
        players = SiteUser.objects.filter(online_status=True)
        players_data = [{"username": player.username} for player in players]
        self.send(text_data=json.dumps(players_data))

    def broadcast_online_players(self):
        players = SiteUser.objects.filter(online_status=True)
        players_data = [{"username": player.username} for player in players]
        async_to_sync(self.channel_layer.group_send)(
            "online_players",
            {
                "type": "online.players.update",
                "players_data": players_data,
            }
        )

    def online_players_update(self, event):
        self.send_online_players()

    def invite(self, event):
        if event['to'] == self.scope['user'].username:
            self.send(text_data=json.dumps({
                'type': 'invite',
                'from': event['from']
        }))