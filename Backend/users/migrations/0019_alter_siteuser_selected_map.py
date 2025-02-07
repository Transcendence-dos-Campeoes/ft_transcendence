from django.db import migrations

def create_default_maps(apps, schema_editor):
    GameMap = apps.get_model('users', 'GameMap')
    
    maps = [
        {
            'name': 'Classic',
            'ball_color': '#FFFFFF',
            'background_color': '#000000',
            'paddle_color': '#FFFFFF',
            'wall_color': '#FFFFFF'
        },
        {
            'name': 'Neon',
            'ball_color': '#FF00FF',
            'background_color': '#000000',
            'paddle_color': '#00FF00',
            'wall_color': '#0000FF'
        },
        {
            'name': 'Ocean',
            'ball_color': '#0080FF',
            'background_color': '#000040',
            'paddle_color': '#00FFFF',
            'wall_color': '#0000FF'
        },
        {
            'name': 'Sunset',
            'ball_color': '#FFD700',
            'background_color': '#1A0000',
            'paddle_color': '#FF4500',
            'wall_color': '#800000'
        }
    ]
    
    for map_data in maps:
        GameMap.objects.create(**map_data)

class Migration(migrations.Migration):
    dependencies = [
        ('users', '0017_gamemap'),
    ]

    operations = [
        migrations.RunPython(create_default_maps),
    ]