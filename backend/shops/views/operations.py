from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from shops.serializers.operations import (
    InventorySerializer,
    PartUsageSerializer,
    WorkOrderAssignmentSerializer,
    WorkOrderSerializer,
)

from ..models import Inventory, PartUsage, WorkOrder


class WorkOrderViewSet(viewsets.ModelViewSet):
    queryset = WorkOrder.objects.all()
    serializer_class = WorkOrderSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        search_query = self.request.query_params.get("search", None)

        if search_query:
            return WorkOrder.objects.filter(
                Q(ticket_id__iexact=search_query)
                | Q(item__serial_number__iexact=search_query)
            ).select_related("item", "assigned_osta_tech", "assigned_sabi_tech")

        user = self.request.user
        user_profile = getattr(user, "profile", None)
        if not user_profile:
            return WorkOrder.objects.none()

        return WorkOrder.objects.filter(tenant=user_profile.tenant)

    @action(detail=True, methods=["patch"], url_path="assign-techs")
    def assign_techs(self, request, pk=None):
        work_order = self.get_object()
        data = request.data

        if "assigned_osta_tech" in data:
            work_order.assigned_osta_tech_id = data["assigned_osta_tech"]

        if "assigned_sabi_tech" in data:
            work_order.assigned_sabi_tech_id = data["assigned_sabi_tech"]

        work_order.save()
        return Response(
            {"status": "Technicians updated successfully"}, status=status.HTTP_200_OK
        )


class IsOwnerOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return (
            request.user.is_authenticated
            and getattr(request.user, "profile", None)
            and request.user.profile.role == "OWNER"
        )


class InventoryViewSet(viewsets.ModelViewSet):
    permission_classes = [IsOwnerOrReadOnly]
    serializer_class = InventorySerializer

    def get_queryset(self):
        user_profile = getattr(self.request.user, "profile", None)
        if not user_profile or not user_profile.tenant:
            return Inventory.objects.none()
        return Inventory.objects.filter(tenant=user_profile.tenant)


class PartUsageViewSet(viewsets.ModelViewSet):
    queryset = PartUsage.objects.all()
    serializer_class = PartUsageSerializer

    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.profile.tenant)


class PublicTicketTrackerView(APIView):
    permission_classes = []

    def get(self, request, ticket_id):
        order = get_object_or_404(WorkOrder, ticket_id=ticket_id)

        data = {
            "ticket_id": order.ticket_id,
            "item_name": order.item_name,
            "status": order.status,
            "brand": order.brand,
            "model": order.model,
            "created_at": order.created_at,
        }
        return Response(data, status=status.HTTP_200_OK)
