from rest_framework import serializers
from .models import Item, WorkOrder,Customer
from .models.auth import ActionToken

    
    
class WorkOrderCreateSerializer(serializers.ModelSerializer):
  device_type = serializers.CharField(write_only=True)
  brand = serializers.CharField(write_only=True)
  model_name = serializers.CharField(write_only=True)
  serial_number = serializers.CharField(write_only=True)
  
  customer = serializers.PrimaryKeyRelatedField(
        queryset=Customer.objects.all(), 
        write_only=True)
  
  class Meta:
      model = WorkOrder
      fields = [
            'customer','device_type', 'brand', 'model_name' ,'serial_number', 
            'description', 'estimate_price', 'deposit_paid', 'status'
            ] 
    
  def create(self, validated_data):
        customer = validated_data.pop('customer')
        device_type = validated_data.pop('device_type')
        brand = validated_data.pop('brand')
        model_name = validated_data.pop('model_name')
        serial = validated_data.pop('serial_number')

        from authentication.models import UserProfile
        user = self.context['request'].user
        
        try:
            user_profile = UserProfile.objects.get(user=user)
            tenant = user_profile.tenant
        except UserProfile.DoesNotExist:
            raise serializers.ValidationError({
                "detail": f"User {user.username} does not have a UserProfile. Create one in Django Admin."
            })

        item, created = Item.objects.get_or_create(
            tenant=tenant,
            serial_number=serial,
            customer = customer,
            defaults={'device_type': device_type, 'brand': brand, 'model_name': model_name}
        )

        work_order = WorkOrder.objects.create(
            item=item,
            tenant=tenant,
            **validated_data
        )
        return work_order
    
class ActionTokenSerializer(serializers.ModelSerializer):
    class Meta:
        model = ActionToken
        # We don't include 'id' or 'is_used' in inputs; they are auto-generated
        fields = ['phone_number', 'token_type', 'related_ticket', 'metadata', 'expires_at']
        extra_kwargs = {
            'expires_at': {'required': False},
            'related_ticket': {'required': False},
        }

    def validate_phone_number(self, value):
        # Basic validation: strip spaces and ensure it's a decent length
        # You can add more complex regex here later
        cleaned = value.replace(" ", "")
        if len(cleaned) < 10:
            raise serializers.ValidationError("Phone number is too short.")
        return cleaned