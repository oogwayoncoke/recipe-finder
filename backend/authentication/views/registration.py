from django.contrib.auth.models import User
from rest_framework import generics, status
from rest_framework.permissions import AllowAny

from ..serializers.registration import (
    CustomerOnboardSerializer,
    OwnerRegistrationSerializer,
    TechActivateSerializer,
)


class OwnerRegisterView(generics.CreateAPIView):
    permission_classes = [AllowAny]
    serializer_class = OwnerRegistrationSerializer


class TechActivateView(generics.CreateAPIView):
    permission_classes = [AllowAny]
    serializer_class = TechActivateSerializer


class CustomerOnboardView(generics.CreateAPIView):
    permission_classes = [AllowAny]
    serializer_class = CustomerOnboardSerializer
