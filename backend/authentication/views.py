from django.contrib.auth.models import User
from allauth.account.models import EmailConfirmation, EmailConfirmationHMAC
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status,generics
from rest_framework.permissions import AllowAny
from.serializers import UserSerializer


# 1. THE MISSING VIEW:
class CreateUserView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

class ConfirmEmailView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        key = request.data.get('key')
        
        # 1. Try to find the confirmation object by key
        confirmation = EmailConfirmationHMAC.from_key(key)
        if not confirmation:
            try:
                confirmation = EmailConfirmation.objects.get(key=key.lower())
            except EmailConfirmation.DoesNotExist:
                return Response({'error': 'Invalid key'}, status=status.HTTP_404_NOT_FOUND)

        # 2. Activate the user and mark email as verified
        confirmation.confirm(request)
        user = confirmation.email_address.user
        user.is_active = True
        user.save()

        return Response({'message': 'Email confirmed!'}, status=status.HTTP_200_OK)