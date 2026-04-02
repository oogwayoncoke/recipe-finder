from django.urls import path
from .views import FavouriteListView, FavouriteToggleView, FavouriteStatusView

urlpatterns = [
    # Changed from 'favorites' to 'likes' logic
    path('', FavouriteListView.as_view(), name='favorite-list'),
    path('recipes/<int:external_id>/', FavouriteToggleView.as_view(), name='favorite-toggle'),
    path('recipes/<int:external_id>/status/', FavouriteStatusView.as_view(), name='favorite-status'),
]