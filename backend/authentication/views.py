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


from .models import UserProfile
from shops.models import Tenant
from .serializers import UserSerializer
from .serializers import UserSerializer, MyTokenObtainPairSerializer


class CreateUserView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]
    
    def perform_create(self, serializer):
        with transaction.atomic():
            shop_name = self.request.data.get('shop_name')
            invite_token = self.request.data.get('invite_token')
            
            # Initial save - we will modify activity status below
            user = serializer.save()
        
            # PATH 1: NEW OWNER (Needs Email Verification)
            if shop_name:
                tenant = Tenant.objects.create(
                    shop_name=shop_name, 
                    owner_email=user.email
                )
                UserProfile.objects.create(user=user, tenant=tenant, role='OWNER')
                
                # Owners must verify email, so they stay inactive
                user.is_active = False 
                user.save()
            
            # PATH 2: INVITED STAFF (Auto-verified by Token)
            elif invite_token:
                try:
                    # Swapping 'Invitation' for your new 'ActionToken' logic if applicable
                    # but keeping your variable name to avoid breaking code.
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
                # Security fallback: If neither, deactivate user
                user.is_active = False
                user.save()
class ConfirmEmailView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        key = request.data.get('key')
        
        confirmation = EmailConfirmationHMAC.from_key(key)
        if not confirmation:
            try:
                confirmation = EmailConfirmation.objects.get(key=key.lower())
            except EmailConfirmation.DoesNotExist:
                return Response({'error': 'Invalid key'}, status=status.HTTP_404_NOT_FOUND)

        confirmation.confirm(request)
        user = confirmation.email_address.user
        user.is_active = True
        user.save()

        return Response({'message': 'Email confirmed!'}, status=status.HTTP_200_OK)
    
class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer