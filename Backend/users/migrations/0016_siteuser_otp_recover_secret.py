# Generated by Django 5.1.4 on 2025-02-06 14:03

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0015_siteuser_is_otp_verified'),
    ]

    operations = [
        migrations.AddField(
            model_name='siteuser',
            name='otp_recover_secret',
            field=models.CharField(blank=True, max_length=32, null=True),
        ),
    ]
