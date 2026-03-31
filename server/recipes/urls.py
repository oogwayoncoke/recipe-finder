from django.urls import path
from .views import RecipeListView, RecipeSearchView, RecipeDetailView

urlpatterns = [
    path('',                   RecipeListView.as_view(),   name='recipe-list'),
    path('search/',            RecipeSearchView.as_view(), name='recipe-search'),
    path('<int:external_id>/', RecipeDetailView.as_view(), name='recipe-detail'),
]