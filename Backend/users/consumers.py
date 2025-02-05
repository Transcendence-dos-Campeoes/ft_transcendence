import json
from channels.generic.websocket import WebsocketConsumer

from asgiref.sync import async_to_sync
from .models import SiteUser

from matches.models import Match
from matches.serializers import MatchSerializer


import uuid

channel_user_map = {}
group_channel_map = {}

group_match_map = {}

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
        self.close()    

    def disconnect(self, close_code):
        async_to_sync(self.channel_layer.group_discard)("online_players", self.channel_name)
        if self.channel_name in channel_user_map:
            del channel_user_map[self.channel_name]
        self.broadcast_online_players()

    def receive(self, text_data):
        data = json.loads(text_data)
        if data['type'] == 'lobby':
            self.send_online_players()
        if data['type'] == 'invite':
            self.handle_invite(data)
        elif data['type'] == 'accept_invite':
            self.handle_accept_invite(data)
        elif data['type'] == 'decline_invite':
            self.handle_decline_invite(data)
        elif data['type'] == 'player_move':
            self.handle_player_move(data)
        elif data['type'] == 'ready':
            self.starting_game(data)
        elif data['type'] == 'game_update':
            self.handle_game_update(data)
        elif data['type'] == 'end_game':
            self.handle_end_game(data)
        elif data['type'] == 'waiting_game':
            self.handle_waitlist(data)
        elif data['type'] == 'close_await':
            self.handle_close_await(data)

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

    def handle_decline_invite(self, data):
        async_to_sync(self.channel_layer.group_send)(
            "online_players",
            {
                "type": "decline_invite",
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
        players_data = [{"username": user.username} for user in channel_user_map.values()]
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
        if 'to' in event and event['to'] == self.scope['user'].username:

            # Add both players to the game group
            game_group_name = f"game_{uuid.uuid4()}"
            async_to_sync(self.channel_layer.group_add)(game_group_name, self.channel_name)
            async_to_sync(self.channel_layer.group_add)(game_group_name, self.get_channel_name(event['from']))

            if game_group_name not in group_channel_map:
                group_channel_map[game_group_name] = []
            group_channel_map[game_group_name].append(self.channel_name)
            group_channel_map[game_group_name].append(self.get_channel_name(event['from']))

            self.send(text_data=json.dumps({
                'type': 'start_game',
                'from': event['from'],
                'game_group': game_group_name,
                'player': 'player2'
            }))

            async_to_sync(self.channel_layer.group_send)(game_group_name, {
                'type': 'start_game',
                'from': event['from'],
                'game_group': game_group_name,
                'player': 'player1'
            })
            match_serializer = MatchSerializer(data={
            'player2': SiteUser.objects.get(username=event['from']).id,
            'player1': SiteUser.objects.get(username=event['to']).id,
            'status': 'active'
            })
            if match_serializer.is_valid():
                match = match_serializer.save()
                group_match_map[game_group_name] = match.id
                print( group_match_map[game_group_name])
            else:
                print("Validation errors:", match_serializer.errors)
        else:
            self.send(text_data=json.dumps(event))

    def decline_invite(self, event):
        if 'to' in event and event['to'] == self.scope['user'].username:
            self.send(text_data=json.dumps(event))

    def get_channel_name(self, username):
        for channel_name, user in channel_user_map.items():
            if user.username == username:
                return channel_name
        return None
    
    def send_to_channel(self, username, message):
        channel_name = self.get_channel_name(username)
        if channel_name:
            async_to_sync(self.channel_layer.send)(channel_name, {
                'type': 'start_game',
                "text": json.dumps(message)})

    def start_game(self, event):
        print(event)
        if (event['from'] == self.scope['user'].username):
            self.send(text_data=json.dumps(event))
    
    def starting_game(self, event):
        self.send(text_data=json.dumps(event))
         # Create a new match instance

    def handle_player_move(self, data):
        async_to_sync(self.channel_layer.group_send)(
            data['game_group'], 
            {
                "type": "player_move",
                "player": data['player'],
                "velocityY": data['velocityY'],
                "user": data['user']
            })
    
    def handle_game_update(self, data):
        async_to_sync(self.channel_layer.group_send)(
        data['game_group'], 
        {
            "type": "game_update",
            "player1": data['player1'],
            "player2": data['player2'],
            "ball": data['ball'],
            "game_group": data['game_group'],
            "user": data['user'],
            "player1Score": data['player1Score'],
            "player2Score": data['player2Score']
        }
        )
    
    def handle_end_game(self, data):

        async_to_sync(self.channel_layer.group_send)(
        data['game_group'], 
        {
            "type": 'end_game',
            "user": data['user'],
            "game_group":  data['game_group'],
            "player1Score": data['player1Score'],
            "player2Score": data['player2Score']
        })
        users = []
        if data['game_group'] in group_channel_map:
            for channel_name in group_channel_map[data['game_group']]:
                print (channel_user_map[channel_name])
                users.append(channel_user_map[channel_name])
                async_to_sync(self.channel_layer.group_discard)(data['game_group'], channel_name)
            del group_channel_map[data['game_group']]
            user1 = users[0]
            user2 = users[1]

            try:
                user1_id = SiteUser.objects.get(username=user1).id
                print(user1_id, "U1")
                user2_id = SiteUser.objects.get(username=user2).id
                print(user2_id, "U2")

            except SiteUser.DoesNotExist as e:
                print(f"Error: {e}")

            print(user1, "   ", user2)
            match_id = group_match_map[data['game_group']]
            print(match_id)
            match = Match.objects.get(id=match_id)
            if not match:
                print ("Nao há arroz")
            match.player1_score = data['player1Score']
            match.player2_score = data ['player2Score']
            if data['player1Score'] > data['player2Score']:
                match.winner = SiteUser.objects.get(username=user1)
            else:
                match.winner = SiteUser.objects.get(username=user2)
            match.status = 'finished'
            match.save()


    def game_update(self, event):
        if (event['user'] != self.scope['user'].username):
            self.send(text_data=json.dumps(event))
        
    def player_move(self, event):
        self.send(text_data=json.dumps(event))

    def end_game(self, event):
        self.send(text_data=json.dumps(event))

    def check_open_games():
        for group_name, channels in group_channel_map.items():
            if len(channels) == 1:
                return group_name
        return None
    
    def handle_waitlist(self, event):
        group = OnlinePlayersConsumer.check_open_games()
        if group is None:
            game_group_name = f"game_{uuid.uuid4()}"
            async_to_sync(self.channel_layer.group_add)(game_group_name, self.channel_name)

            if game_group_name not in group_channel_map:
                group_channel_map[game_group_name] = []
            group_channel_map[game_group_name].append(self.channel_name)
        
        else:
            user_in_group = [channel_user_map[channel_name].username for channel_name in group_channel_map[group]][0]
            print (user_in_group)
            group_channel_map[group].append(self.channel_name)
            self.send(text_data=json.dumps({
                'type': 'start_game',
                'from': self.scope['user'].username,
                'game_group': group,
                'player': 'player2'
            }))
            async_to_sync(self.channel_layer.group_send)(group, {
                'type': 'start_game',
                'from':user_in_group,
                'game_group': group,
                'player': 'player1'
            })
            match_serializer = MatchSerializer(data={
            'player2': SiteUser.objects.get(username=self.scope['user'].username).id,
            'player1': SiteUser.objects.get(username=user_in_group).id,
            'status': 'active'
            })
            if match_serializer.is_valid():
                match = match_serializer.save()
                group_match_map[game_group_name] = match.id
                print( group_match_map[group])
            else:
                print("Validation errors:", match_serializer.errors)


    