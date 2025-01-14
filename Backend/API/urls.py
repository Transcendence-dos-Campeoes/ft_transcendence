from django.urls import path
from . import views

urlpatterns = [
	path('', views.getUsersData),
	path('create/', views.createUser),
]