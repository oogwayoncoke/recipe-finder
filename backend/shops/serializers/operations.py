from rest_framework import serializers
from django.db import transaction
from ..models import WorkOrder, Customer, Item, CustomerPhone
from .. models.auth import ActionToken

class CustomerOnboardingSerializer(serializers.ModelSerializer):
    token = serializers.UUIDField(write_only=True) 
    full_name = serializers.CharField(write_only=True)
    device_type = serializers.CharField(write_only=True)
    brand = serializers.CharField(write_only=True)
    model_name = serializers.CharField(write_only=True)
    serial_number = serializers.CharField(write_only=True)
    
    class Meta:
        model = WorkOrder
        fields = [
            'token', 'full_name', 'device_type', 'brand', 
            'model_name', 'serial_number', 'description'
        ] 
    
    def create(self, validated_data):
        token_id = validated_data.pop('token')
        full_name = validated_data.pop('full_name')
        device_type = validated_data.pop('device_type')
        brand = validated_data.pop('brand')
        model_name = validated_data.pop('model_name')
        serial_number = validated_data.pop('serial_number')
        description = validated_data.get('description')

        try:
            invite = ActionToken.objects.get(id=token_id, token_type='CUSTOMER_INVITE')
            tenant = invite.tenant
        except ActionToken.DoesNotExist:
        
            raise serializers.ValidationError({
            "token": "This invitation link has already been used or is invalid."
        })
        with transaction.atomic():
            customer, _ = Customer.objects.get_or_create(
                tenant=tenant,
                full_name=full_name,
            )

            if invite.phone_number:
                CustomerPhone.objects.get_or_create(
                    customer=customer,
                    phone_number=invite.phone_number,
                    tenant=tenant
                )

            item = Item.objects.create(
                tenant=tenant,
                customer=customer,
                device_type=device_type,
                brand=brand,
                model_name=model_name,
                serial_number=serial_number
            )

            work_order = WorkOrder.objects.create(
                tenant=tenant,
                item=item,
                description=description,
                status='pending'
            )
            
            invite.delete()
            return work_order