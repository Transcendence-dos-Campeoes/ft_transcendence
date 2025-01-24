from django.urls import path
from . import views

urlpatterns = [
    path('create/', views.create_user, name='create_user'),
    path('login/', views.loginUser, name='login_user'),
    path('users/', views.getUsersData, name='get_users_data'),
]