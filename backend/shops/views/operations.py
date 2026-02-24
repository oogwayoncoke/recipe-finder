import jwt
from django.db.models import ExpressionWrapper, F, Q, Sum, fields
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
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

    def perform_update(self, serializer):
        instance = self.get_object()
        user_profile = getattr(self.request.user, "profile", None)
        new_status = self.request.data.get("status")

        if (
            user_profile
            and user_profile.role == "TECH"
            and user_profile.tech_level == "OSTA"
        ):
            if instance.assigned_osta_tech != user_profile:
                raise PermissionDenied({"detail": "Authorization Denied."})

        if new_status == "completed":
            invoice = getattr(instance, "invoice", None)
            if not invoice:
                raise ValidationError({"detail": "Invoice Required."})
            if hasattr(invoice, "is_paid") and not invoice.is_paid:
                raise ValidationError({"detail": "Payment Required."})

        serializer.save()

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
        user_profile = getattr(self.request.user, "profile", None)
        manual_total = request.data.get("total_override")

        if (
            user_profile
            and user_profile.role == "TECH"
            and user_profile.tech_level == "OSTA"
        ):
            if order.assigned_osta_tech != user_profile:
                raise PermissionDenied({"detail": "Access Denied."})

        if order.status != "ready":
            return Response(
                {"detail": "Ready status required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        parts_cost = float(
            sum(p.price_at_use * p.quantity_used for p in order.requisitions.all())
        )

        sessions = order.sessions.filter(end_time__isnull=False)
        duration_stats = sessions.annotate(
            duration=ExpressionWrapper(
                F("end_time") - F("start_time"), output_field=fields.DurationField()
            )
        ).aggregate(total_time=Sum("duration"))

        total_duration = duration_stats["total_time"]
        total_seconds = total_duration.total_seconds() if total_duration else 0

        tech = order.assigned_osta_tech
        hourly_rate = float(getattr(tech, "hourly_rate", 0)) if tech else 0

        base_estimate = float(order.estimate_price or 0)
        time_labor = (total_seconds / 3600) * hourly_rate
        labor_cost = base_estimate + time_labor

        suggested_total = round(parts_cost + labor_cost, 2)

        invoice, created = Invoice.objects.get_or_create(
            work_order=order,
            tenant=order.tenant,
            defaults={"total_amount": suggested_total},
        )

        if manual_total is not None:
            invoice.total_amount = manual_total
        else:
            invoice.total_amount = suggested_total

        invoice.save()

        return Response(
            {
                "id": invoice.id,
                "total": float(invoice.total_amount),
                "labor_breakdown": {
                    "base": base_estimate,
                    "time_based": round(time_labor, 2),
                    "seconds_logged": total_seconds,
                    "rate_used": hourly_rate,
                },
                "status": "created" if created else "updated",
            },
            status=status.HTTP_200_OK,
        )

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
        user_profile = getattr(self.request.user, "profile", None)
        if not user_profile:
            return PartUsage.objects.none()
        return PartUsage.objects.filter(tenant=user_profile.tenant)
    def perform_create(self, serializer):
        inventory_id = self.request.data.get("inventory_item")
        inventory_item = get_object_or_404(Inventory, id=inventory_id)
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
