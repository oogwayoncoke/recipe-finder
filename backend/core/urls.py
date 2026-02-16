from django.contrib import admin
from django.conf.urls.static import static
from django.conf import settings
from django.urls import path,include
from authentication.views import CreateUserView,ConfirmEmailView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("authentication/user/register/",CreateUserView.as_view(),name="register"),
    path("authentication/token/",TokenObtainPairView.as_view(), name= "get_token"),
    path("authentication/token/refresh/",TokenRefreshView.as_view(),name="refresh"),
    path("authentication-auth/", include("rest_framework.urls")),
    path("authentication/",include("authentication.urls")),
    path("authentication/user/verify-email/", ConfirmEmailView.as_view(), name="confirm_email"),
    
]
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)