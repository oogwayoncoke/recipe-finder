from django.contrib.auth.models import User
from django.db import transaction
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status,generics
from rest_framework.permissions import AllowAny
from rest_framework.exceptions import ValidationError
from rest_framework_simplejwt.views import TokenObtainPairView
from allauth.account.models import EmailConfirmation, EmailConfirmationHMAC
from shops.models import Tenant
from shops.models.auth import ActionToken


from ..models import UserProfile
from shops.models import Tenant
from ..serializers.generics import UserSerializer
from ..serializers.generics import UserSerializer, MyTokenObtainPairSerializer


class CreateUserView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]
    
    def perform_create(self, serializer):
        with transaction.atomic():
            shop_name = self.request.data.get('shop_name')
            invite_token = self.request.data.get('invite_token')
            
            
            user = serializer.save()
        
            if shop_name:
                tenant = Tenant.objects.create(
                    shop_name=shop_name, 
                    owner_email=user.email
                )
                UserProfile.objects.create(user=user, tenant=tenant, role='OWNER')
                
                
                user.is_active = False 
                user.save()
            
           
            elif invite_token:
                try:
                    
                    invitation = ActionToken.objects.get(id=invite_token, is_used=False)
                    
                    UserProfile.objects.create(
                        user=user, 
                        tenant=invitation.tenant, 
                        role=invitation.role,
                        tech_level=invitation.tech_level
                    )

                    invitation.is_used = True
                    invitation.save()

                    # Bypass email verification for staff
                    user.is_active = True 
                    user.save()
                    
                except (ActionToken.DoesNotExist, ValidationError):
                    raise ValidationError({"invite_token": "Invalid or already used invitation token."})
            
            else:
               
                user.is_active = False
                user.save()
class ConfirmEmailView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        key = request.data.get('key')
        
        # 1. Look up the confirmation object
        confirmation = EmailConfirmationHMAC.from_key(key)
        if not confirmation:
            try:
                confirmation = EmailConfirmation.objects.get(key=key)
            except EmailConfirmation.DoesNotExist:
                return Response({'error': 'Invalid key'}, status=status.HTTP_400_BAD_REQUEST)

        # 2. THE FIX: If already verified, just say "Identity Verified" and exit.
        # This handles the second React call gracefully.
        if confirmation.email_address.verified:
            return Response({'message': 'Identity Verified'}, status=status.HTTP_200_OK)

        # 3. First-time confirmation logic
        email_address = confirmation.confirm(request)
        if email_address:
            user = email_address.user
            user.is_active = True
            user.save()
            return Response({'message': 'Identity Verified'}, status=status.HTTP_200_OK)
            
        return Response({'error': 'Confirmation failed'}, status=status.HTTP_400_BAD_REQUEST)
    
class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer