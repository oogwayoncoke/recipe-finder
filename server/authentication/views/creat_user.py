from allauth.account.models import EmailConfirmation, EmailConfirmationHMAC
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from ..serializers.generics import MyTokenObtainPairSerializer, UserSerializer


class ConfirmEmailView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        key = request.data.get("key")

        confirmation = EmailConfirmationHMAC.from_key(key)
        if not confirmation:
            try:
                confirmation = EmailConfirmation.objects.get(key=key)
            except EmailConfirmation.DoesNotExist:
                return Response(
                    {"error": "Invalid key"}, status=status.HTTP_400_BAD_REQUEST
                )

        if confirmation.email_address.verified:
            return Response(
                {"message": "Identity Verified"}, status=status.HTTP_200_OK
            )

        email_address = confirmation.confirm(request)
        if email_address:
            user = email_address.user
            user.is_active = True
            user.save()
            return Response({'message': 'Identity Verified'}, status=status.HTTP_200_OK)

        return Response({'error': 'Confirmation failed'}, status=status.HTTP_400_BAD_REQUEST)


class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer


class UserRegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserSerializer(
            data=request.data, context={"request": request}
        )
        if serializer.is_valid():
            user = serializer.save()
            return Response(
                UserSerializer(user).data, status=status.HTTP_201_CREATED
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)