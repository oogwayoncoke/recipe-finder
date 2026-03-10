from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from authentication.views import AvatarUploadView, ProfileView, ConfirmEmailView, MyTokenObtainPairView, UserRegisterView


urlpatterns = [
    # Auth
    path('register/', UserRegisterView.as_view(), name='register'),
    path('verify-email/', ConfirmEmailView.as_view(), name='confirm-email'),
    path('token/', MyTokenObtainPairView.as_view(), name='token-obtain'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),

    # Profile
    path('profile/', ProfileView.as_view(), name='profile'),
    path('profile/avatar/', AvatarUploadView.as_view(), name='profile-avatar'),
]
