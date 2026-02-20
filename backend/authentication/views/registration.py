from django.contrib.auth.models import User
from rest_framework import status,generics
from rest_framework.permissions import AllowAny
from ..serializers.registration import (
    OwnerRegistrationSerializer, 
    TechActivationSerializer, 
    CustomerOnboardSerializer
)



class OwnerRegisterView(generics.CreateAPIView):
    permission_classes = [AllowAny]
    serializer_class = OwnerRegistrationSerializer

# TECH ACTIVATION
class TechActivateView(generics.CreateAPIView):
    permission_classes = [AllowAny]
    serializer_class = TechActivationSerializer

# CUSTOMER REPAIR LOG
class CustomerOnboardView(generics.CreateAPIView):
    permission_classes = [AllowAny]
    serializer_class = CustomerOnboardSerializer