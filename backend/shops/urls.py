from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views.finance import FinanceSummaryView
from .views.operations import (
    InventoryViewSet,
    PartUsageViewSet,
    PublicTicketTrackerView,
    ServiceViewSet,
    WorkOrderViewSet,
    WorkSessionViewSet,
)
from .views.staff import (
    OstaListView,
    SabiListView,
    StaffTreasuryListView,
    UserProfileDetailView,
)
from .views.user_create import (
    CreateActionLinkView,
    ValidateOneClickView,
    WorkOrderCreateView,
)

router = DefaultRouter()

router.register(r"inventory", InventoryViewSet, basename="inventory")
router.register(r"work-orders", WorkOrderViewSet, basename="work-order")
router.register(r"part-usage", PartUsageViewSet, basename="part-usage")
router.register(r"work-sessions", WorkSessionViewSet, basename="worksession")
router.register(r"services", ServiceViewSet, basename="service")
urlpatterns = [
    path("invites/", CreateActionLinkView.as_view(), name="create-action-linx"),
    path("validate/<uuid:token_id>/", ValidateOneClickView.as_view(), name="validate"),
    path("work-order/create/", WorkOrderCreateView.as_view(), name="create-work-order"),
    path(
        "track/<str:ticket_id>/", PublicTicketTrackerView.as_view(), name="public-track"
    ),
    path("staff/sabis/", SabiListView.as_view(), name="sabi-list"),
    path("staff/ostas/", OstaListView.as_view(), name="osta-list"),
    path("profiles/<int:pk>/", UserProfileDetailView.as_view(), name="profile-detail"),
    path("staff/treasury/", StaffTreasuryListView.as_view(), name="staff-treasury"),
    path("finance/summary/", FinanceSummaryView.as_view(), name="finance-summary"),
    path("", include(router.urls)),
]
