from authentication.models import UserProfile
from rest_framework import serializers


class StaffProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ["id", "user", "username", "tech_level", "tenant"]
