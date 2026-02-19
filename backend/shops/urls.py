from django.urls import path
from .views import GenerateInvitationView, WorkOrderCreateView

urlpatterns = [
    path('invites/generate/', GenerateInvitationView.as_view(), name='generate-invite'),
    path('work-order/create/', WorkOrderCreateView.as_view(), name='create-work-order'),
]