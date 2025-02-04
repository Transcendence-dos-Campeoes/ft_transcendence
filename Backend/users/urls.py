from django.urls import path
from . import views

urlpatterns = [
    path('create/', views.create_user, name='create_user'),
    path('login/', views.loginUser, name='login_user'),
    path('logout/', views.logoutUser, name='logout-user'),
    path('users/', views.getUsersData, name='get_users_data'),
    path('profile/', views.getUserProfile, name='get_user_profile'),
    path('profile/update/', views.updateUserProfile, name='update_user_profile'),
]