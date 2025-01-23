from django.urls import path
from . import views


urlpatterns = [
	path('', views.getUsersData),
	path('create/', views.create_user),
    path('login/', views.loginUser),
    path('test/', views.test_token),
    
]