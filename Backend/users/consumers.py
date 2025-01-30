import json
from channels.generic.websocket import WebsocketConsumer

from asgiref.sync import async_to_sync
from .models import SiteUser


import uuid

channel_user_map = {}

def get_channel_name(username):
    for channel_name, user in channel_user_map.items():
        if user.username == username:
            return channel_name
    return None


class OnlinePlayersConsumer(WebsocketConsumer):
    def connect(self):
        """Connect the user."""
        user = self.scope['user']
        if user.is_authenticated:
            self.accept()
            async_to_sync(self.channel_layer.group_add)("online_players", self.channel_name)
            print("CONNECTED: ", self.scope['user'])
            channel_user_map[self.channel_name] = self.scope['user']
            self.send_online_players()
            self.broadcast_online_players()
        else:
            self.close()

    def close_connection(self, event):
        data = {
                "type": "close_connection",
            }
        self.send(text_data=json.dumps(data))
        print(data)
        self.close()

    def disconnect(self, close_code):
        async_to_sync(self.channel_layer.group_discard)("online_players", self.channel_name)
        if self.channel_name in channel_user_map:
            del channel_user_map[self.channel_name]
        self.broadcast_online_players()

    def receive(self, text_data):
        data = json.loads(text_data)
        if data['type'] == 'invite':
            self.handle_invite(data)
        elif data['type'] == 'accept_invite':
            self.handle_accept_invite(data)
        if data['type'] == 'player_move':
            self.handle_player_move(data)
        # if data['type'] == 'close_connection':

        # if data['type'] == 'websocket'

    def handle_invite(self, data):
        async_to_sync(self.channel_layer.group_send)(
            "online_players",
            {
                "type": "invite",
                "from": data['from'],
                "to": data['to']
            }
        )

    def handle_accept_invite(self, data):
        async_to_sync(self.channel_layer.group_send)(
            "online_players",
            {
                "type": "accept_invite",
                "from": data['from'],
                "to": data['to']
            }
        )

    def send_online_players(self):
        players_data = [{"username": user.username} for user in channel_user_map.values()]
        data = {
                "type": "online.players.update",
                "players_data": players_data,
            }
        self.send(text_data=json.dumps(data))

    def broadcast_online_players(self):
        players_data = [{"username": user.username} for user in channel_user_map.values ()]
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
            text_data=json.dumps({
                'type': 'invite',
                'from': event['from']
            })
            self.send(text_data)
            
    def accept_invite(self, event):

        if 'to' in event     and event['to'] == self.scope['user'].username:

            # Add both players to the game group
            game_group_name = f"game_{uuid.uuid4()}"
            async_to_sync(self.channel_layer.group_add)(game_group_name, self.channel_name)
            async_to_sync(self.channel_layer.group_add)(game_group_name, self.get_channel_name(event['from']))

            self.send(text_data=json.dumps({
                'type': 'accept_invite',
                'from': event['from'],
                'game_group': game_group_name,
                'player': 'player2'
            }))

            self.send_to_channel(event['from'], {
                'from': self.scope['user'].username,
                'game_group': game_group_name,
                'player': 'player1'
            })
        else:
            self.send(text_data=json.dumps(event))
            

    def get_channel_name(self, username):
        for channel_name, user in channel_user_map.items():
            if user.username == username:
                return channel_name
        return None
    
    def send_to_channel(self, username, message):
        channel_name = self.get_channel_name(username)
        print(message)
        if channel_name:
            async_to_sync(self.channel_layer.send)(channel_name, {
                'type': 'accept_invite',
                "text": json.dumps(message)})

    def game_update(self, event):
        self.send(text_data=json.dumps(event))


    # def handle_player_move(self, data):
    #     # Update player velocity based on received data
    #     if data['player'] == 1:
    #         player1['velocityY'] = data['velocityY']
    #     elif data['player'] == 2:
    #         player2['velocityY'] = data['velocityY']

    #     # Broadcast the updated game state to both players
    #     async_to_sync(self.channel_layer.group_send)(
    #         data['game_group'],
    #         {
    #             'type': 'game_update',
    #             'player': data['player']
    #             'player2': player2,
    #             'ball': ball
    #         }
    #     )