import jwt
from authentication.models import UserProfile
from rest_framework import serializers

from ..models import Inventory, PartUsage, Service, Technician, WorkOrder
from ..models.operations import WorkSession


class WorkOrderAssignmentSerializer(serializers.ModelSerializer):
    assigned_osta_tech = serializers.PrimaryKeyRelatedField(
        queryset=UserProfile.objects.filter(role="TECH", tech_level="OSTA"),
        required=False,
        allow_null=True,
    )
    assigned_sabi_tech = serializers.PrimaryKeyRelatedField(
        queryset=UserProfile.objects.filter(role="TECH", tech_level="SABI"),
        required=False,
        allow_null=True,
    )

    class Meta:
        model = WorkOrder
        fields = ["assigned_osta_tech", "assigned_sabi_tech", "status"]

    def validate(self, data):
        request = self.context.get("request")
        user_profile = getattr(request.user, "profile", None)

        if not user_profile:
            raise serializers.ValidationError("This account has no workshop profile.")

        if user_profile.role == "TECH" and user_profile.tech_level == "OSTA":
            if not self.instance.assigned_osta_tech:
                data["assigned_osta_tech"] = user_profile
            elif self.instance.assigned_osta_tech != user_profile:
                raise serializers.ValidationError(
                    "This task is already claimed by another Osta."
                )
        return data

    def update(self, instance, validated_data):
        if validated_data.get("assigned_sabi_tech") and instance.status == "pending":
            instance.status = "diagnosing"
        return super().update(instance, validated_data)


class InventorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Inventory
        fields = [
            "id",
            "name",
            "sku",
            "product_type",
            "cost_price",
            "retail_price",
            "stock_count",
            "specifications",
            "is_active",
            "low_stock_threshold",
        ]

    def create(self, validated_data):
        request = self.context.get("request")
        if request and hasattr(request.user, "profile"):
            validated_data["tenant"] = request.user.profile.tenant
        return Inventory.objects.create(**validated_data)


class WorkSessionSerializer(serializers.ModelSerializer):
    is_active = serializers.SerializerMethodField()
    duration_seconds = serializers.SerializerMethodField()
    service_name = (
        serializers.SerializerMethodField()
    )  # Changed to MethodField for safety
    variance_percentage = serializers.SerializerMethodField()

    class Meta:
        model = WorkSession
        fields = "__all__"

    def get_is_active(self, obj):
        return obj.end_time is None

    def get_duration_seconds(self, obj):
        from django.utils import timezone

        start = obj.start_time
        end = obj.end_time or timezone.now()
        return int((end - start).total_seconds())

    def get_service_name(self, obj):
        if obj.service:
            return obj.service.service_name
        return "General Diagnosis"

    def get_variance_percentage(self, obj):
        if not obj.service or not obj.end_time:
            return 0

        try:
            if not obj.service.standard_duration:
                return 0

            actual = (obj.end_time - obj.start_time).total_seconds()
            standard = obj.service.standard_duration.total_seconds()
            variance = ((actual - standard) / standard) * 100
            return round(variance, 2)
        except Exception:
            return 0


class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = ["id", "service_name", "cost", "standard_duration", "tenant"]
        extra_kwargs = {"tenant": {"read_only": True}}

    def create(self, validated_data):
        request = self.context.get("request")
        auth_header = request.headers.get("Authorization")
        if auth_header and "Bearer " in auth_header:
            token = auth_header.split(" ")[1]
            payload = jwt.decode(token, options={"verify_signature": False})
            validated_data["tenant_id"] = payload.get("tenant_id")

        return super().create(validated_data)


class PartUsageSerializer(serializers.ModelSerializer):

    part_name = serializers.ReadOnlyField(source="inventory_item.name")

    class Meta:
        model = PartUsage
        fields = [
            "id",
            "work_order",
            "inventory_item",
            "part_name",
            "quantity_used",
            "price_at_use",
        ]
        read_only_fields = ["price_at_use"]


class WorkOrderSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source="item.name", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    parts_used = PartUsageSerializer(many=True, read_only=True)
    sessions = WorkSessionSerializer(many=True, read_only=True)

    services = serializers.PrimaryKeyRelatedField(
        queryset=Service.objects.all(), many=True, required=False
    )

    service_details = ServiceSerializer(source="services", many=True, read_only=True)

    class Meta:
        model = WorkOrder
        fields = [
            "id",
            "ticket_id",
            "item_name",
            "status",
            "status_display",
            "assigned_osta_tech",
            "assigned_sabi_tech",
            "estimate_price",
            "services",
            "service_details",
            "parts_used",
            "sessions",
            "created_at",
        ]

    def update(self, instance, validated_data):
        services_data = validated_data.pop("services", self.allow_null)
        instance = super().update(instance, validated_data)
        if services_data is not None:
            instance.services.set(services_data)
        return instance
