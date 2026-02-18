from django.urls import path
from .views import GenerateInvitationView

urlpatterns = [
    path('invites/generate/', GenerateInvitationView.as_view(), name='generate-invite'),
]