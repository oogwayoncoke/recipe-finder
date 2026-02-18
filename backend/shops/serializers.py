from rest_framework import serializers
from .models.base import Invitation

class InvitationSerializer(serializers.ModelSerializer):
  tenant_name = serializers.ReadOnlyField(source='tenant.shop_name')
  
  class Meta:
    model = Invitation
    fields = ['token', 'email', 'tenant_name', 'created_at']
    read_only_fields = ['token', 'created_at']