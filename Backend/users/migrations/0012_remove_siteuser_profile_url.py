

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0011_siteuser_profile_image'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='siteuser',
            name='profile_URL',
        ),
    ]
