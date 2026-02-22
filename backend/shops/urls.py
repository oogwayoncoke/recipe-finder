from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views.operations import (
    InventoryViewSet,
    PartUsageViewSet,
    PublicTicketTrackerView,
    WorkOrderViewSet,
)
from .views.staff import OstaListView, SabiListView
from .views.user_create import (
    CreateActionLinkView,
    ValidateOneClickView,
    WorkOrderCreateView,
)

router = DefaultRouter()

router.register(r"inventory", InventoryViewSet, basename="inventory")
router.register(r"work-orders", WorkOrderViewSet, basename="work-order")
router.register(r"part-usage", PartUsageViewSet, basename="part-usage")

urlpatterns = [
    path("invites/", CreateActionLinkView.as_view(), name="create-action-linx"),
    path("validate/<uuid:token_id>/", ValidateOneClickView.as_view(), name="validate"),
    path("work-order/create/", WorkOrderCreateView.as_view(), name="create-work-order"),
    path(
        "track/<str:ticket_id>/", PublicTicketTrackerView.as_view(), name="public-track"
    ),
    path("staff/sabis/", SabiListView.as_view(), name="sabi-list"),
    path("staff/ostas/", OstaListView.as_view(), name="osta-list"),
    path("", include(router.urls)),
]
