from authentication.models import UserProfile
from rest_framework import serializers

from ..models.operations import WorkOrder


class WorkOrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkOrder
        fields = "__all__"


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
