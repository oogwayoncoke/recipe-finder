from authentication.models import UserProfile
from rest_framework import serializers

from ..models import Inventory, PartUsage, WorkOrder


class WorkOrderSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source="item.name", read_only=True)
    item_type = serializers.CharField(source="item.device_type", read_only=True)
    brand = serializers.CharField(source="item.brand", read_only=True)
    model = serializers.CharField(source="item.model_name", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = WorkOrder
        fields = [
            "id",
            "ticket_id",
            "item_name",
            "item_type",
            "brand",
            "model",
            "description",
            "status",
            "status_display",
            "assigned_osta_tech",
            "assigned_sabi_tech",
            "estimate_price",
            "deposit_paid",
            "created_at",
        ]

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
        ]

    def create(self, validated_data):

        request = self.context.get("request")

        if request and hasattr(request.user, "profile"):
            validated_data["tenant"] = request.user.profile.tenant

        return Inventory.objects.create(**validated_data)


class PartUsageSerializer(serializers.ModelSerializer):
    class Meta:
        model = PartUsage
        fields = [
            "id",
            "work_order",
            "inventory_item",
            "technician",
            "quantity_used",
            "price_at_use",
        ]
        read_only_fields = ["price_at_use"]
        extra_kwargs = {"technician": {"required": False, "allow_null": True}}

    def create(self, validated_data):
        request = self.context.get("request")
        user = request.user

        if hasattr(user, "osta_profile"):
            validated_data["technician"] = user.osta_profile
        elif hasattr(user, "sabi_profile"):
            validated_data["technician"] = user.sabi_profile

        if hasattr(user, "profile"):
            validated_data["tenant"] = user.profile.tenant

        return super().create(validated_data)
