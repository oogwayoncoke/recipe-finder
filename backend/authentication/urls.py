from django.urls import path, include
from .views import CreateUserView, ConfirmEmailView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
  path('register/', CreateUserView.as_view(), name='register'),
  path('verify-email/', ConfirmEmailView.as_view(), name='confirm_email'),
  path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
  path('token/refresh/', TokenRefreshView.as_view, name='token_refresh')
  ]