from django.urls import path
from .views import MealPlanView, MealPlanEntryView, GroceryListView

urlpatterns = [
    path('',              MealPlanView.as_view(),      name='mealplan'),
    path('entry/',        MealPlanEntryView.as_view(), name='mealplan-entry'),
    path('grocery-list/', GroceryListView.as_view(),   name='grocery-list'),
]
