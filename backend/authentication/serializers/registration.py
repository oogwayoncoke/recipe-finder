from django.contrib.auth.models import User
from django.db import transaction
from rest_framework import serializers
from authentication.models import UserProfile
from shops.models import Tenant, WorkOrder, Item
from shops.models.auth import ActionToken
from dj_rest_auth.registration.serializers import RegisterSerializer
from allauth.account.models import EmailAddress, EmailConfirmation 
from django.contrib.auth import get_user_model
from allauth.account.utils import complete_signup 
from allauth.account import app_settings as allauth_settings

User = get_user_model()



class OwnerRegistrationSerializer(RegisterSerializer):
    username = serializers.CharField(required=True, max_length=150)
    first_name = serializers.CharField(required=True)
    last_name = serializers.CharField(required=True)
    shop_name = serializers.CharField(write_only=True, required=True)

    def get_cleaned_data(self):
        cleaned_data = super().get_cleaned_data()
        cleaned_data['username'] = self.validated_data.get('username')
        cleaned_data['first_name'] = self.validated_data.get('first_name')
        cleaned_data['last_name'] = self.validated_data.get('last_name')
        return cleaned_data

    def save(self, request=None):
        if request is None:
            request = self.context.get('request')
        
        with transaction.atomic():
            user = super().save(request)
        
        
        user.first_name = self.validated_data.get('first_name')
        user.last_name = self.validated_data.get('last_name')
        user.save()
        
       
        tenant = Tenant.objects.create(
            shop_name=self.validated_data.get('shop_name'),
            first_name=user.first_name,
            last_name=user.last_name,
            owner_email=user.email 
        )
        
        
        if hasattr(user, 'user_profile'):
            profile = user.user_profile
            profile.tenant = tenant
            profile.role = 'OWNER'
            profile.save()

        
        email_address = EmailAddress.objects.get(user=user, email=user.email)
        email_address.send_confirmation(request, signup=True)
        
        return user
           
          
          
class TechActivationSerializer(serializers.ModelSerializer):
    token_id = serializers.UUIDField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'password', 'token_id']
        extra_kwargs = {'password': {'write_only': True}}

    def validate_token_id(self, value):
        token = ActionToken.objects.filter(id=value, is_used=False).first()
        if not token:
            raise serializers.ValidationError("Invalid or expired invite link.")
        return token

    def create(self, validated_data):
        token = validated_data.pop('token_id')
        with transaction.atomic():
        
            user = User.objects.create_user(
                username=validated_data['username'],
                password=validated_data['password'],
                is_active=True
            )
            
            
            UserProfile.objects.create(
                user=user, 
                tenant=token.tenant, 
                role=token.role, 
                tech_level=token.tech_level
            )

            token.is_used = True
            token.save()
            return user
          
          
          
class CustomerOnboardSerializer(serializers.ModelSerializer):
    token_id = serializers.UUIDField(write_only=True)
    device_name = serializers.CharField(write_only=True)
    issue_description = serializers.CharField(write_only=True)

    class Meta:
        model = WorkOrder
        fields = ['token_id', 'device_name', 'issue_description']

    def create(self, validated_data):
        token_id = validated_data.pop('token_id')
        device_name = validated_data.pop('device_name')
        issue_description = validated_data.pop('issue_description')


        token = ActionToken.objects.get(id=token_id, is_used=False)
        
        with transaction.atomic():
            from shops.models import Customer, Item
            
            
            customer = Customer.objects.filter(
                tenant=token.tenant, 
                phones__phone_number=token.phone_number 
            ).first()

            if not customer:
                customer = Customer.objects.create(
                    tenant=token.tenant,
                    full_name="New Customer" 
                )

                customer.phones.create(
                    tenant=token.tenant, # Inherits from TenantModel
                    phone_number=token.phone_number
                )

            device_code = 'MOBL'
            if any(x in device_name.lower() for x in ['pc', 'laptop', 'mac', 'desktop']):
                device_code = 'COMP'
            elif any(x in device_name.lower() for x in ['ps', 'xbox', 'switch', 'game']):
                device_code = 'GAME'

            # 3. CREATE THE ITEM
            item = Item.objects.create(
                tenant=token.tenant,
                customer=customer,
                device_type=device_code,
                model_name=device_name    
            )

            work_order = WorkOrder.objects.create(
                tenant=token.tenant,
                item=item,
                description=issue_description,
                status='pending'
            )
            token.is_used = True
            token.save()

            return work_order