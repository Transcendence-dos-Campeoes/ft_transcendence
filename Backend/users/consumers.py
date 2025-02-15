import json
from channels.generic.websocket import WebsocketConsumer
import time
from asgiref.sync import async_to_sync
from .models import SiteUser
from .serializers import FriendsSerializer
from matches.models import Match
from matches.serializers import MatchSerializer
from tournaments.models import TournamentMatch
from tournaments.models import Tournament
from django.core.exceptions import ObjectDoesNotExist
from django.utils import timezone
from web3 import Web3
from django.conf import settings
import random
import asyncio

import uuid

channel_user_map = {}
group_channel_map = {}

group_match_map = {}
match_ready = {} 

game_state = {} # store the state of each game group

def get_channel_name(username):
    for channel_name, user in channel_user_map.items():
        if user.username == username:
            return channel_name
    return None


def get_match_by_id(match_id):
    try:
        return Match.objects.get(id=match_id)
    except ObjectDoesNotExist:
        print(f"Match with ID {match_id} does not exist.")
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
            #self.send_online_players()
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

        if data['type'] != 'game_update' and data['type'] != 'player_move':
            print(data)
        
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

        #game updates
        elif data['type'] == 'game_update':
            self.handle_game_update(data)
        elif data['type'] == 'end_game':
            self.handle_end_game(data)
        elif data['type'] == 'player_warning':
            self.handle_player_warning(data)
        elif data['type'] == 'resume_game':
            self.handle_resume_game(data)

        #random game
        elif data['type'] == 'waiting_game':
            self.handle_waitlist(data)
        elif data['type'] == 'random_ready':
            self.handle_ready(data)

        #tournaments
        elif data['type'] == 'invite_tournament_game':
            self.handle_invite_tournament_game(data)
        elif data['type'] == 'accept_invite_tournament_game':
            self.handle_accept_invite_tournament_game(data)

        #friends
        elif data['type'] == 'update_lobby':
            self.broadcast_online_players()
        # elif data['type'] == 'random_game':
        #     self.handle_random(data)
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
        user = self.scope['user']
        serializer = FriendsSerializer(user)
        friends_data = serializer.data.get('friends', [])
        online_friends = [friend for friend in friends_data if friend['username'] in [user.username for user in channel_user_map.values()]]  

        data = {
            "type": "online.players.update",
            "players_data": online_friends,
        }
        self.send(text_data=json.dumps(data))

    def broadcast_online_players(self):
        user = self.scope['user']
        serializer = FriendsSerializer(user)
        friends_data = serializer.data.get('friends', [])
        online_friends = [friend for friend in friends_data if friend['username'] in [user.username for user in channel_user_map.values()]]  

        async_to_sync(self.channel_layer.group_send)(
            "online_players",
            {
                "type": "online.players.update",
                "players_data": online_friends,
            }
        )

    def online_players_update(self, event):
        self.send_online_players()

    def is_user_in_group(self, username):
        channel_name = get_channel_name(username)
        if not channel_name:
            return False
        for channels in group_channel_map.values():
            if channel_name in channels:
                return True
        return False
    
    def invite(self, event):
        if event['to'] == self.scope['user'].username:

            if self.is_user_in_group(event['to']):
                async_to_sync(self.channel_layer.group_send)(
                "online_players",
                {
                    "type": "decline_invite",
                    "from": self.scope['user'].username,
                    "to": event['from']
                }
                )
            else:
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
                'player': 'player2',
                'player1': event['to'],
                'player2': event['from'],
            }))

            async_to_sync(self.channel_layer.group_send)(game_group_name, {
                'type': 'start_game',
                'from': event['from'],
                'game_group': game_group_name,
                'player': 'player1',
                'player1': event['to'],
                'player2': event['from'],
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
        if (event['from'] == self.scope['user'].username):
            self.send(text_data=json.dumps(event))

    
    def starting_game(self, event):
        self.send(text_data=json.dumps(event))
         # Create a new match instance

    ################ GAME UPDATE ###########################

    def handle_player_move(self, data):

        game_group = data['game_group']
        player = data['player']
        position = data['position']

        async_to_sync(self.channel_layer.group_send)(
            data['game_group'], 
            {
                "type": "player_move",
                "user": data['user'],
                "player": player,
                "game_group": game_group,
                "position": position,
            })
    
    # Check for paddle collisions

    def handle_game_update(self, data):
        game_group = data['game_group']
        # state = game_state[game_group]
        ball_position = data['ball']
        ball_velocity = data['ballVelocity']
        # field_length = 8.5
        # field_width = 5
        # ball_size = 0.2  
        # paddle_height = 1.1
        # paddle_width = 0.2

        # # Update ball position
        # ball_position['x'] += ball_velocity['x']
        # ball_position['y'] += ball_velocity['y']
    
        # # Check for collisions with the top and bottom walls
        # field_top = field_width / 2 - ball_size / 2
        # field_bottom = -field_width / 2 + ball_size / 2
        # if ball_position['y'] >= field_top or ball_position['y'] <= field_bottom:
        #     ball_velocity['y'] *= -1
    
        # # Check for paddle collisions
        # player1_position = state['player1_position']
        # player2_position = state['player2_position']
        # paddle_left = -(field_length / 2) + paddle_width / 2
        # paddle_right = (field_length / 2) - paddle_width / 2

        # # Check collision with player 1's paddle

        # VELOCITY_MULTIPLIER = 1.1
        # IMPACT_MULTIPLIER = 0.1
        # COLLISION_OFFSET = 0.05

        # if (ball_position['x'] <= paddle_left + ball_size / 2 and
        #     player1_position - paddle_height / 2 <= ball_position['y'] <= player1_position + paddle_height / 2):
        #     ball_velocity['x'] *= -VELOCITY_MULTIPLIER
        #     impact_point = (ball_position['y'] - player1_position) / (paddle_height / 2)
        #     ball_velocity['y'] += impact_point * IMPACT_MULTIPLIER
        #     ball_position['x'] = paddle_left + ball_size / 2 + COLLISION_OFFSET

        # # Check collision with player 2's paddle
        # if (ball_position['x'] >= paddle_right - ball_size / 2 and
        #     player2_position - paddle_height / 2 <= ball_position['y'] <= player2_position + paddle_height / 2):
        #     ball_velocity['x'] *= -VELOCITY_MULTIPLIER
        #     impact_point = (ball_position['y'] - player2_position) / (paddle_height / 2)
        #     ball_velocity['y'] += impact_point * IMPACT_MULTIPLIER
        #     ball_position['x'] = paddle_right - ball_size / 2 - COLLISION_OFFSET


        # # Check for goals
        # field_left = -(field_length + 0.5) / 2
        # field_right = (field_length + 0.5) / 2
        player1_score = data['player1Score']
        player2_score = data['player2Score']
        # if ball_position['x'] >= field_right:
        #     player1_score += 1
        #     ball_position = {'x': 0, 'y': 0}
        #     ball_velocity = {'x': -0.1, 'y': 0.06}
        # elif ball_position['x'] <= field_left:
        #     player2_score += 1
        #     ball_position = {'x': 0, 'y': 0}
        #     ball_velocity = {'x': 0.1, 'y': 0.06}
    
        # # Update the game state
        # state['ball_position'] = ball_position
        # state['ball_velocity'] = ball_velocity
        # state['player1_score'] = player1_score
        # state['player2_score'] = player2_score

        # Check for game over
        if player1_score >= 5 or player2_score >= 5:
            self.handle_end_game({
                'user': data['user'],
                'game_group': game_group,
                'player1Score': player1_score,
                'player2Score': player2_score
            })
            return
    
        # Broadcast updated ball position and velocity to all clients
        async_to_sync(self.channel_layer.group_send)(
            data['game_group'],
            {
                "type": "game_update",
                "user": data['user'],
                "ball": ball_position,
                "ballVelocity": ball_velocity,
                "game_group": data['game_group'],
                "player1Score": player1_score,
                "player2Score": player2_score
            }
        )
    
    def handle_player_warning(self, data):
        async_to_sync(self.channel_layer.group_send)(
        data['game_group'], 
        {
            "type": 'player_warning',
            "user": data['user'],
            "game_group":  data['game_group'],
        })

    def handle_resume_game(self, data):
        async_to_sync(self.channel_layer.group_send)(
        data['game_group'], 
        {
            "type": 'resume_game',
            "user": data['user'],
            "game_group":  data['game_group'],
        })
    

    def game_update(self, event):
        if not 'user' in event:
            self.send(text_data=json.dumps(event))
        elif (event['user'] != self.scope['user'].username):
            self.send(text_data=json.dumps(event))
        
    def player_move(self, event):
        if (event['user'] != self.scope['user'].username):
            self.send(text_data=json.dumps(event))

    def player_warning(self, event):
        if (event['user'] != self.scope['user'].username):
            self.send(text_data=json.dumps(event))
    
    def resume_game(self, event):
        if (event['user'] != self.scope['user'].username):
            self.send(text_data=json.dumps(event))


    ###########################################################

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
                user2_id = SiteUser.objects.get(username=user2).id

            except SiteUser.DoesNotExist as e:
                print(f"Error: {e}")

            match_id = group_match_map[data['game_group']]
            match = Match.objects.get(id=match_id)
            if not match:
                print ("Nao há arroz")
            match.player1_score = data['player1Score']
            match.player2_score = data ['player2Score']
            if data['player1Score'] > data['player2Score']:
                match.winner = SiteUser.objects.get(username=user1)
            else:
                match.winner = SiteUser.objects.get(username=user2)
            if match.player1_score == 5 or match.player2_score == 5:
                match.status = 'finished'
            else:
                match.status = 'cancelled'
            match.save()

            try:
                tournament_match = TournamentMatch.objects.get(match=match.id)
                self.fill_tournament(tournament_match, match)
            except:
                print(f"Match {match.id} is not related to any tournament")
            
        if data['game_group'] in game_state:
            del game_state[data['game_group']]

    def end_game(self, event):
        self.send(text_data=json.dumps(event))


#Handle randomized games

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
            async_to_sync(self.channel_layer.group_add)(group, self.channel_name)
            group_channel_map[group].append(self.channel_name)
            if group not in match_ready:
                match_ready[group] = []
            match_ready[group] = 0
            time.sleep(1)
            match_serializer = MatchSerializer(data={
            'player2': SiteUser.objects.get(username=self.scope['user'].username).id,
            'player1': SiteUser.objects.get(username=user_in_group).id,
            'status': 'active'
            })
            if match_serializer.is_valid():
                match = match_serializer.save()
                group_match_map[group] = match.id
                print( group_match_map[group])
            else:
                print("Validation errors:", match_serializer.errors)
            async_to_sync(self.channel_layer.group_send)(group, {
                'type': 'random_game',
                'from':user_in_group,
                'game_group': group,
                'player': 'player1',
                'opponent':  self.scope['user'].username,
                'player1': user_in_group,
                'player2' : self.scope['user'].username
            })

    def random_game(self, event):
        self.send(text_data=json.dumps(event))

    def handle_ready(self, event):
        if 'game_group' not in event:
            user = event['user']
            if self.is_user_in_group(user):
                game_group = group_channel_map[user]
            else:
                print("Error: 'game_group' key not found in event and user is not part of any game group")
                return
        else:
            game_group = event['game_group']
            user = event['from']
        
        match = Match.objects.get(id = group_match_map[game_group])


        if game_group not in match_ready:
            match_ready[game_group] = 0
        print(match_ready[game_group])
        if match_ready[game_group] == 0:
            match_ready[game_group] = 1
        else:
            match_ready[game_group] = 2
            self.send(text_data=json.dumps({
                'type': 'start_game',
                'from': user,
                'game_group': game_group,
                'player1': match.player1.username,
                'player2': match.player2.username,
            }))
            async_to_sync(self.channel_layer.group_send)(game_group, {
                'type': 'start_game',
                'from': user,
                'game_group': game_group,
                'player1': event['player1'],
                'player2': event['player2'],
            })
    

    def handle_close_await(self, data):
        open_game = OnlinePlayersConsumer.check_open_games()
        if open_game:
            player_channel = group_channel_map[open_game][0]
            if data['from'] == channel_user_map[player_channel].username:
                async_to_sync(self.channel_layer.group_discard)(open_game, player_channel)
                if open_game in group_channel_map:
                    del group_channel_map[open_game]
                return
        if 'game_group' in data:
            game_id = group_match_map[data["game_group"]]
            match = Match.objects.get(id = game_id)
            if data['from'] == match.player1.username:
                match.player1_score = 0
                match.player2_score = 3
                match.winner = match.player2
            elif data['from'] == match.player2.username:
                match.player1_score = 3
                match.player2_score = 0
                match.winner = match.player1

            match.status = 'cancelled'
            match.save()
            text_data = {
                "type": 'end_game',
                "user": data['from'],
                "game_group":  data['game_group'],
                "player1Score": match.player1_score,
                "player2Score": match.player2_score
                }
            self.handle_end_game(text_data)
            
    #TOURNAMENT

    def handle_invite_tournament_game(self, data):
        async_to_sync(self.channel_layer.group_send)(
            "online_players",
             {
                "type": "invite_tournament_game",
                "from": data['from'],
                "to": data['to'],
                'game': data['game'],
                'player1': data['player1'], 
                'player2': data['player2'], 
            }
        )

    def invite_tournament_game(self, event):
        if event['to'] == self.scope['user'].username:
            text_data=json.dumps({
                'type': 'invite_tournament_game',
                'from': event['from'],
                'game': event['game'],
                'player1': event['player1'], 
                'player2': event['player2'], 
            })
            self.send(text_data)

    def handle_accept_invite_tournament_game(self, data):
        async_to_sync(self.channel_layer.group_send)(
            "online_players",
            {
                "type": "accept_invite_tournament_game",
                "from": data['from'],
                "to": data['to'],
                'game': data['game'],
                'player1': data['player1'], 
                'player2': data['player2'],
            }
        )
    
    def accept_invite_tournament_game(self, event):
        if 'to' in event and event['to'] == self.scope['user'].username:

            # Add both players to the game group
            game_group_name = f"game_{uuid.uuid4()}"
            async_to_sync(self.channel_layer.group_add)(game_group_name, self.channel_name)
            async_to_sync(self.channel_layer.group_add)(game_group_name, self.get_channel_name(event['from']))

            if game_group_name not in group_channel_map:
                group_channel_map[game_group_name] = []
            group_channel_map[game_group_name].append(self.channel_name)
            group_channel_map[game_group_name].append(self.get_channel_name(event['from']))

            match = get_match_by_id(event['game'])
            if match:
                group_match_map[game_group_name] = match.id
                match.status = 'active'
                match.save()
            
                if (self.scope['user'].username == event['player1']):
                    self.send(text_data=json.dumps({
                        'type': 'start_game',
                        'from': event['from'],
                        'game_group': game_group_name,
                        'player': 'player1',
                        'player1': event['from'],
                        'player2': event['to'],
                    }))
                    async_to_sync(self.channel_layer.group_send)(game_group_name, {
                        'type': 'start_game',
                        'from': event['from'],
                        'game_group': game_group_name,
                        'player': 'player2',
                        'player1': event['from'],
                        'player2': event['to'],
                    })
                else:
                    self.send(text_data=json.dumps({
                        'type': 'start_game',
                        'from': event['from'],
                        'game_group': game_group_name,
                        'player': 'player2',
                        'player1': event['to'],
                        'player2': event['from'],
                    }))
                    async_to_sync(self.channel_layer.group_send)(game_group_name, {
                        'type': 'start_game',
                        'from': event['from'],
                        'game_group': game_group_name,
                        'player': 'player1',
                        'player1': event['to'],
                        'player2': event['from'],
                    })
            else:
                print("Match not found.")
        else:
            self.send(text_data=json.dumps(event))

    def fill_tournament(self, tournament_match, match):
        try:
            if tournament_match.next_match:
                next_match = TournamentMatch.objects.get(id=tournament_match.next_match.id).match
                if next_match.player1 is not None:
                    next_match.player2 = match.winner
                else:
                    next_match.player1 = match.winner
                next_match.save()
            else:
                # If there is no next match, finalize the tournament
                finalized_tournament = Tournament.objects.get(id=tournament_match.tournament.id)
                finalized_tournament.finished_at = timezone.now()
                finalized_tournament.status = 'finished'
                finalized_tournament.winner = match.winner
                finalized_tournament.save()

                try:
                    url = settings.INFURA_URL
                    private_key = settings.PRIVATE_KEY
                    w3 = Web3(Web3.HTTPProvider(url))
                    account = w3.eth.account.from_key(private_key)
                    with open('/usr/src/contracts/artifacts/contracts/tournament.sol/tournamentResults.json') as f:
                        contract_json = json.load(f)
                        contract_abi = contract_json['abi']
                
                    with open('/usr/src/contracts/deployed-address.json') as f:
                        contract_data = json.load(f)
                        contract_address = contract_data['address']
                    
                    # Create transaction
                    tx = {
                        'nonce': w3.eth.get_transaction_count(account.address),
                        'gas': 150000,
                        'gasPrice': w3.eth.gas_price,
                        'to': contract_address,
                        'data': w3.eth.contract(abi=contract_abi).encodeABI(
                            fn_name='storeTournamentDetails',
                            args=[
                                tournament_match.tournament.id,
                                str(match.winner),
                            ]
                        )
                    }
                    
                    # Sign and send
                    signed = w3.eth.account.sign_transaction(tx, private_key)
                    tx_hash = w3.eth.send_raw_transaction(signed.rawTransaction)
                    print(f"Tournament saved to blockchain: {tx_hash.hex()}")
                    
                except Exception as e:
                    print(f"Blockchain save failed: {e}")

        except TournamentMatch.DoesNotExist:
            print(f"Next tournament match for tournament match does not exist.")

