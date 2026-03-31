from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views.creat_user import UserRegisterView, ConfirmEmailView, MyTokenObtainPairView
from .views.google import GoogleLoginView
from .views.password_reset import PasswordResetRequestView, PasswordResetConfirmView

urlpatterns = [
    path('register/',                    UserRegisterView.as_view(),          name='auth-register'),
    path('login/',                       MyTokenObtainPairView.as_view(),   name='auth-login'),
    path('token/refresh/',               TokenRefreshView.as_view(),        name='auth-token-refresh'),
    path('confirm-email/<str:key>/',     ConfirmEmailView.as_view(),        name='auth-confirm-email'),
    path('google/',                      GoogleLoginView.as_view(),         name='auth-google'),
    path('password-reset/',              PasswordResetRequestView.as_view(), name='auth-password-reset'),
    path('password-reset/confirm/',      PasswordResetConfirmView.as_view(), name='auth-password-reset-confirm'),
]