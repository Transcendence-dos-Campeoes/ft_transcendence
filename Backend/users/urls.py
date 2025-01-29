from django.urls import path
from . import views

urlpatterns = [
    path('create/', views.create_user, name='create_user'),
    path('login/', views.loginUser, name='login_user'),
    path('logout/', views.logoutUser, name='logout-user'),
    path('delete/', views.deleteUser, name='delete-user'),
    path('users/', views.getUsersData, name='get_users_data'),
	path('oauth_callback/', views.oauth_callback),
    path('profile/', views.getUserProfile, name='get_user_profile'),
    path('profile/update/', views.updateUserProfile, name='update_user_profile'),
    path('friends/', views.getFriends, name='get_friends'),
    path('friend/delete/<int:friend_id>/', views.deleteFriend, name='delete_friend'),
    path('invites/', views.getInvites, name='get_invites'),
    path('invite/create/', views.createInvite, name='create_invite'),
    path('invite/update/', views.changeStatusInvite, name='change_status_invite'),
]