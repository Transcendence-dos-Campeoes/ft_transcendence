from django.urls import path
from . import views
from .schema import schema_view

urlpatterns = [
	path('', views.getUsersData),
	path('create/', views.createUser),
	path('docs/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
]