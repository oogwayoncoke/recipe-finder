from allauth.account.models import EmailAddress
from authentication.models import UserProfile
from dj_rest_auth.registration.serializers import RegisterSerializer
from django.contrib.auth import get_user_model
from django.contrib.auth.models import User
from django.db import transaction
from rest_framework import serializers
from shops.models import Customer, CustomerPhone, Item, Technician, Tenant, WorkOrder
from shops.models.auth import ActionToken

from ..constants import INVITE_TYPE_STAFF, ROLE_TECH

User = get_user_model()

class OwnerRegistrationSerializer(RegisterSerializer):
    
    username = serializers.CharField(required=True, max_length=150)
    first_name = serializers.CharField(required=True)
    last_name = serializers.CharField(required=True)
    shop_name = serializers.CharField(write_only=True, required=True)
    def validate(self, data):
        if Tenant.objects.filter(shop_name=data.get('shop_name')).exists():
            raise serializers.ValidationError({
                "shop_name": "A shop with this name already exists."
            })
        if Tenant.objects.filter(owner_email=data.get('email')).exists():
            raise serializers.ValidationError({
            "email": "This email is already linked to an existing shop."
            })
            
        return data
    
    
    def get_cleaned_data(self):
        cleaned_data = super().get_cleaned_data()
        cleaned_data['username'] = self.validated_data.get('username')
        cleaned_data['first_name'] = self.validated_data.get('first_name')
        cleaned_data['last_name'] = self.validated_data.get('last_name')
        return cleaned_data

    def save(self, request=None):
        
        if request is None:
            request = self.context.get('request')
        
        
        email = self.validated_data.get('email')
        shop = self.validated_data.get('shop_name')

        with transaction.atomic():
            
            user = super().save(request)
            
           
            tenant = Tenant.objects.create(shop_name=shop, owner_email=email)
            UserProfile.objects.create(user=user, tenant=tenant, role='OWNER')
            
           
            try:
                email_address = EmailAddress.objects.get(user=user, email=user.email)
                email_address.send_confirmation(request, signup=True)
            except Exception as e:
                print(f"Email sending failed: {e}")
                
            return user


class CustomerOnboardSerializer(serializers.ModelSerializer):
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


User = get_user_model()

from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework import serializers

# Remove all custom imports for a second to prevent circular import crashes

User = get_user_model()

class TechActivateSerializer(serializers.Serializer):
    token = serializers.UUIDField(write_only=True)
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(write_only=True)

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("This username is already taken.")
        return value

    def create(self, validated_data):
        from authentication.models import UserProfile
        from shops.models.auth import ActionToken

        token_id = validated_data.get('token')

        with transaction.atomic():

            try:
                token_obj = ActionToken.objects.select_for_update().get(id=token_id)
            except ActionToken.DoesNotExist:
                raise serializers.ValidationError(
                    {"detail": "Invite link is invalid or has already been used."}
                )

            user = User.objects.create_user(
                username=validated_data['username'],
                password=validated_data['password'],
                is_active=True
            )

            profile, created = UserProfile.objects.get_or_create(user=user)

            profile.tenant = token_obj.tenant
            profile.role = "TECHNICIAN"
            profile.tech_level = getattr(token_obj, "tech_level", "NONE")
            profile.save()

            token_obj.delete()

            return user
