# Generated by Django 5.1.4 on 2025-01-26 17:08

from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Lobby',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100, unique=True)),
                ('max_players', models.IntegerField(default=2)),
                ('current_players', models.IntegerField(default=0)),
                ('is_active', models.BooleanField(default=False)),
            ],
        ),
    ]
