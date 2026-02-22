from django.urls import path

from .views.operations import WorkOrderViewSet
from .views.staff import OstaListView, SabiListView
from .views.user_create import (
    CreateActionLinkView,
    ValidateOneClickView,
    WorkOrderCreateView,
)

urlpatterns = [
    path("invites/", CreateActionLinkView.as_view(), name="create-action-linx"),
    path("validate/<uuid:token_id>/", ValidateOneClickView.as_view(), name="validate"),
    path("work-order/create/", WorkOrderCreateView.as_view(), name="create-work-order"),
    path(
        "work-order/view/",
        WorkOrderViewSet.as_view({"get": "list"}),
        name="view-work-orders",
    ),
    path(
        "work-order/<int:pk>/assign-techs/",
        WorkOrderViewSet.as_view({"patch": "assign_techs"}),
        name="assign-techs",
    ),
    path("staff/sabis/", SabiListView.as_view(), name="sabi-list"),
    path("staff/ostas/", OstaListView.as_view(), name="osta-list"),
]
