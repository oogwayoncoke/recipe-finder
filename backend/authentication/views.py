from django.contrib.auth.models import User
from django.db import transaction
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status,generics
from rest_framework.permissions import AllowAny
from rest_framework.exceptions import ValidationError
from rest_framework_simplejwt.views import TokenObtainPairView
from allauth.account.models import EmailConfirmation, EmailConfirmationHMAC


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
        
            user = serializer.save()
        
            if shop_name:
                tenant = Tenant.objects.create(shop_name=shop_name)
                UserProfile.objects.create(user=user, tenant=tenant, role='OWNER')

            elif invite_token:
                try:
                    tenant = Tenant.objects.get(tenant_id=invite_token)
                    UserProfile.objects.create(user=user, tenant=tenant, role='TECH')
                except(Tenant.DoesNotExist,ValueError):
                    user.delete()
                    raise ValidationError({"invite_token": "Invalid invite token. This shop does not exist."})
            else:
                user.delete()
                raise ValidationError({"invite_token": "Invalid shop code. This shop does not exist."})

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

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