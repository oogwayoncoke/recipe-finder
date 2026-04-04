from django.urls import path
from .views import ProfileView, AvatarView, DietListView, AllergyListView

urlpatterns = [
    # GET   /profiles/me/            → full profile
    # PATCH /profiles/me/            → update bio / username / diets / allergies
    path('me/', ProfileView.as_view(), name='profile-me'),

    # POST   /profiles/me/avatar/    → upload avatar
    # DELETE /profiles/me/avatar/    → remove avatar
    path('me/avatar/', AvatarView.as_view(), name='profile-avatar'),

    # GET /profiles/diets/           → list all diet options  (public)
    # GET /profiles/allergies/       → list all allergy options (public)
    path('diets/',     DietListView.as_view(),   name='profile-diets'),
    path('allergies/', AllergyListView.as_view(), name='profile-allergies'),
]
