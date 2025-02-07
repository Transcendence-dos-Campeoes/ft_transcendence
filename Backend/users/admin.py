from django.contrib import admin
from .models import SiteUser, Friend, GameMap
# Register your models here.
admin.site.register(SiteUser)
admin.site.register(GameMap)
admin.site.register(Friend)