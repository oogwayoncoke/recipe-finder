from django.urls import path
from likes.views import FavouriteListView, FavouriteToggleView, FavouriteStatusView

urlpatterns = [
    # GET  /favorites/                            → full favorites list
    path('', FavouriteListView.as_view(), name='favorite-list'),

    # POST   /favorites/recipes/<external_id>/    → save recipe
    # DELETE /favorites/recipes/<external_id>/    → unsave recipe
    path('recipes/<int:external_id>/', FavouriteToggleView.as_view(), name='favorite-toggle'),

    # GET  /favorites/recipes/<external_id>/status/  → { is_favorited: bool }
    path('recipes/<int:external_id>/status/', FavouriteStatusView.as_view(), name='favorite-status'),
]
