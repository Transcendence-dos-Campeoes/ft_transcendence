# Generated by Django 5.1.4 on 2025-01-27 10:30

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('matches', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Tournament',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100)),
                ('status', models.CharField(choices=[('pending', 'Pending'), ('active', 'Active'), ('finished', 'Finished'), ('cancelled', 'Cancelled')], default='pending', max_length=20)),
                ('max_players', models.IntegerField(default=8)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('started_at', models.DateTimeField(blank=True, null=True)),
                ('finished_at', models.DateTimeField(blank=True, null=True)),
                ('creator', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='tournaments_created', to=settings.AUTH_USER_MODEL)),
                ('winner', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='tournaments_won', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='TournamentMatch',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('round_number', models.IntegerField()),
                ('match_number', models.IntegerField()),
                ('match', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, to='matches.match')),
                ('next_match', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='previous_matches', to='tournaments.tournamentmatch')),
                ('tournament', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='matches', to='tournaments.tournament')),
            ],
            options={
                'ordering': ['round_number', 'match_number'],
            },
        ),
        migrations.CreateModel(
            name='TournamentPlayer',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('status', models.CharField(choices=[('invited', 'Invited'), ('accepted', 'Accepted'), ('declined', 'Declined'), ('eliminated', 'Eliminated'), ('winner', 'Winner')], default='invited', max_length=20)),
                ('seed', models.IntegerField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('player', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='tournament_entries', to=settings.AUTH_USER_MODEL)),
                ('tournament', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='players', to='tournaments.tournament')),
            ],
            options={
                'unique_together': {('tournament', 'player')},
            },
        ),
    ]