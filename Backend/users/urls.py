from django.urls import path
from . import views

urlpatterns = [
    path('create/', views.create_user, name='create_user'),
    path('login/', views.loginUser, name='login_user'),
    path('logout/', views.logoutUser, name='logout-user'),
    path('delete/', views.deleteUser, name='delete-user'),
    path('users/', views.getUsersData, name='get_users_data'),
	path('oauth_callback/', views.oauth_callback),
    path('settings/', views.getUserSettings, name='get_user_settings'),
    path('settings/maps/', views.getMaps, name='get_maps'),
    path('settings/update/', views.updateUserProfile, name='update_user_profile'),
    path('settings/map/update/', views.updateMap, name='update_map'),
    path('settings/update/password/', views.updateUserPassword, name='update_user_password'),
    path('profile/', views.getUserProfile, name='get_user_profile'),
    path('profile/<str:username>/', views.getFriendProfile, name='get_friend_profile'),
    path('matches/', views.getUserMatches, name='get_user_matches'),
    path('friends/', views.getFriends, name='get_friends'),
    path('friend/delete/<int:friend_id>/', views.deleteFriend, name='delete_friend'),
    path('invites/', views.getInvites, name='get_invites'),
    path('invite/create/', views.createInvite, name='create_invite'),
    path('invite/update/', views.changeStatusInvite, name='change_status_invite'),
	path('twofa/enable/', views.enable_two_fa, name='two_fa_enable'),
	path('twofa/verify/', views.verify_two_fa, name='two_fa_enable'),
	path('check_status/', views.check_user_status, name='check_user_status'),
	path('sendmail/', views.sendMail, name='send_mail')

]