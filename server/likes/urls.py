from django.urls import path
from .views import FavoriteToggleView, FavoriteListView, FavoriteStatusView

urlpatterns = [
    # GET  /favorites/                            → full favorites list
    path('', FavoriteListView.as_view(), name='favorite-list'),

    # POST   /favorites/recipes/<external_id>/    → save recipe
    # DELETE /favorites/recipes/<external_id>/    → unsave recipe
    path('recipes/<int:external_id>/', FavoriteToggleView.as_view(), name='favorite-toggle'),

    # GET  /favorites/recipes/<external_id>/status/  → { is_favorited: bool }
    path('recipes/<int:external_id>/status/', FavoriteStatusView.as_view(), name='favorite-status'),
]
