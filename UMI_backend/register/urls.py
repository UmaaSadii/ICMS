from django.urls import path
from .views import register, login, UserDetailView, UserListView

urlpatterns = [
    path('registration/', register, name='register'),       # POST only
    path('login/', login, name='login'),                     # POST login
    path('users/', UserListView.as_view(), name='user-list'),      # GET all users
    path('users/<int:pk>/', UserDetailView.as_view(), name='user-detail'),  # GET/PUT/DELETE
]