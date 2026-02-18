from django.urls import path, include
from .views import CreateUserView, ConfirmEmailView
from rest_framework_simplejwt.views import TokenRefreshView
from .views import MyTokenObtainPairView

urlpatterns = [
  path('register/', CreateUserView.as_view(), name='register'),
  path('verify-email/', ConfirmEmailView.as_view(), name='confirm_email'),
  path('token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
  path('token/refresh/', TokenRefreshView.as_view, name='token_refresh')
  ]