import jwt
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import Inventory, Invoice, PartUsage, Service, Technician, WorkOrder
from ..models.operations import WorkSession
from ..serializers.operations import (
    InventorySerializer,
    PartUsageSerializer,
    ServiceSerializer,
    WorkOrderAssignmentSerializer,
    WorkOrderSerializer,
    WorkSessionSerializer,
)


class WorkOrderViewSet(viewsets.ModelViewSet):
    queryset = WorkOrder.objects.all()
    serializer_class = WorkOrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        profile = getattr(self.request.user, "profile", None)
        if not profile:
            return WorkOrder.objects.none()
        return WorkOrder.objects.filter(tenant=profile.tenant)

    @action(detail=True, methods=["patch"], url_path="assign-techs")
    def assign_techs(self, request, pk=None):
        order = self.get_object()
        serializer = WorkOrderAssignmentSerializer(
            order, data=request.data, partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["post"], url_path="generate-invoice")
    def generate_invoice(self, request, pk=None):
        order = self.get_object()
        if order.status != "completed":
            return Response({"detail": "Order not ready."}, status=400)

        existing_invoice = getattr(order, "invoice", None)
        if existing_invoice:
            return Response({"id": existing_invoice.id, "status": "existing"})

        parts_cost = sum(
            p.price_at_use * p.quantity_used for p in order.parts_used.all()
        )
        total_amount = parts_cost + (order.estimate_price or 0)

        invoice = Invoice.objects.create(
            work_order=order,
            tenant=order.tenant,
            total_amount=total_amount,
            issued_at=timezone.now(),
        )
        return Response({"id": invoice.id, "total": float(total_amount)}, status=201)


class PublicTicketTrackerView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, ticket_id):
        order = get_object_or_404(WorkOrder, ticket_id=ticket_id)
        data = {
            "ticket_id": order.ticket_id,
            "item_name": order.item.name if order.item else "N/A",
            "status": order.status,
            "brand": order.item.brand if order.item else "N/A",
            "model": order.item.model_name if order.item else "N/A",
            "created_at": order.created_at,
        }
        return Response(data, status=status.HTTP_200_OK)


class PartUsageViewSet(viewsets.ModelViewSet):
    serializer_class = PartUsageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        profile = getattr(self.request.user, "profile", None)
        return (
            PartUsage.objects.filter(tenant=profile.tenant)
            if profile
            else PartUsage.objects.none()
        )

    def perform_create(self, serializer):
        inventory_id = self.request.data.get("inventory_item")
        inventory_item = get_object_or_404(Inventory, id=inventory_id)

        inventory_item.stock_count -= int(self.request.data.get("quantity_used", 1))
        inventory_item.save()

        serializer.save(
            tenant=self.request.user.profile.tenant,
            price_at_use=inventory_item.retail_price,
        )


class InventoryViewSet(viewsets.ModelViewSet):
    serializer_class = InventorySerializer

    def get_queryset(self):
        profile = getattr(self.request.user, "profile", None)
        return (
            Inventory.objects.filter(tenant=profile.tenant)
            if profile
            else Inventory.objects.none()
        )


class WorkSessionViewSet(viewsets.ModelViewSet):
    queryset = WorkSession.objects.all()
    serializer_class = WorkSessionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        profile = getattr(self.request.user, "profile", None)
        return (
            WorkSession.objects.filter(tenant=profile.tenant)
            if profile
            else WorkSession.objects.none()
        )

    @action(detail=True, methods=["post"])
    def start_order(self, request, pk=None):
        order = get_object_or_404(WorkOrder, id=pk)
        WorkSession.objects.filter(technician=request.user, is_active=True).update(
            is_active=False, end_time=timezone.now()
        )
        session = WorkSession.objects.create(
            work_order=order,
            technician=request.user,
            is_active=True,
            tenant=request.user.profile.tenant,
        )
        return Response(self.get_serializer(session).data, status=201)

    @action(detail=False, methods=["post"])
    def stop_session(self, request):
        WorkSession.objects.filter(technician=request.user, is_active=True).update(
            is_active=False, end_time=timezone.now()
        )
        return Response({"status": "stopped"})


class ServiceViewSet(viewsets.ModelViewSet):
    serializer_class = ServiceSerializer

    def get_queryset(self):
        profile = getattr(self.request.user, "profile", None)
        return (
            Service.objects.filter(tenant=profile.tenant).order_by("service_name")
            if profile
            else Service.objects.none()
        )
