from django.contrib.auth.models import User
from allauth.account.models import EmailConfirmation, EmailConfirmationHMAC
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status,generics
from rest_framework.permissions import AllowAny
from.serializers import UserSerializer
from .models import UserProfile
from shops.models import Tenant



class CreateUserView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]
    
    def perform_create(self, serializer):
        shop_name = self.request.data.get('shop_name')
        user = serializer.save()
        
        if shop_name:
            tenant = Tenant.objects.create(shop_name=shop_name)
            UserProfile.objects.create(user=user, tenant=tenant, role='OWNER')
        else:
            invite_token=self.request.data.get('invite_token')\
            
            

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