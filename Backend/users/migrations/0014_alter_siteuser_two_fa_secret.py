# Generated by Django 5.1.4 on 2025-02-04 15:06

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0013_siteuser_two_fa_secret'),
    ]

    operations = [
        migrations.AlterField(
            model_name='siteuser',
            name='two_fa_secret',
            field=models.CharField(blank=True, max_length=32, null=True),
        ),
    ]
