from django.urls import path, include
from .views.create_user import ConfirmEmailView
from rest_framework_simplejwt.views import TokenRefreshView
from authentication.views.create_user import MyTokenObtainPairView
from authentication.views.registration import OwnerRegisterView, TechActivateView, CustomerOnboardView

urlpatterns = [
  path('register/owner/',OwnerRegisterView.as_view(), name='register-owner'),
  path('verify-email/', ConfirmEmailView.as_view(), name='confirm_email'),
  path('activate-tech/', TechActivateView.as_view(), name='activate_tech'),
  path('onboard-customer/', CustomerOnboardView.as_view(), name='onboard-customer'),
  path('token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
  path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh')
  ]