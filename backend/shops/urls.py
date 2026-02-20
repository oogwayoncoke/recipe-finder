from django.urls import path
from .views.user_create import CreateActionLinkView, WorkOrderCreateView,ValidateOneClickView

urlpatterns = [
    path('invites/', CreateActionLinkView.as_view(), name='create-action-linx'),
    path('validate/<uuid:token_id>/',ValidateOneClickView.as_view(), name='validate'),
    path('work-order/create/', WorkOrderCreateView.as_view(), name='create-work-order'),
]
