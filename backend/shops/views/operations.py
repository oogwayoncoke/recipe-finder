from django.db import models
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from shops.serializers.operations import (
    WorkOrderAssignmentSerializer,
    WorkOrderSerializer,
)

from ..models import WorkOrder


class WorkOrderViewSet(viewsets.ModelViewSet):
    queryset = WorkOrder.objects.all()
    serializer_class = WorkOrderSerializer

    @action(detail=True, methods=["patch"], url_path="assign-techs")
    def assign_techs(self, request, pk=None):
        work_order = self.get_object()

        # Use our specialized assignment serializer
        serializer = WorkOrderAssignmentSerializer(
            work_order, data=request.data, context={"request": request}, partial=True
        )

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def get_queryset(self):
        user = self.request.user

        user_profile = getattr(user, "profile", None)
        if not user_profile or not user_profile.tenant:
            return WorkOrder.objects.none()

        base_queryset = WorkOrder.objects.filter(tenant=user_profile.tenant)

        if user_profile.role == "TECH" and user_profile.tech_level == "OSTA":
            return base_queryset.filter(
                models.Q(assigned_osta_tech=user_profile)
                | models.Q(assigned_osta_tech__isnull=True)
            )
        elif user_profile.role == "TECH" and user_profile.tech_level == "SABI":
            return base_queryset.filter(assigned_sabi_tech=user_profile)

        return base_queryset
