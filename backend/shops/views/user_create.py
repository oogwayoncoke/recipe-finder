from authentication.serializers.registration import CustomerOnboardSerializer
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework import generics, status
from rest_framework.exceptions import NotFound
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import WorkOrder
from ..models.auth import ActionToken
from ..serializers.invites import ActionTokenSerializer

User = get_user_model()

class WorkOrderCreateView(generics.CreateAPIView):
    queryset = WorkOrder.objects.all()
    serializer_class = CustomerOnboardSerializer
    permission_classes = [AllowAny]

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        token_uuid = request.data.get("token")

        try:
            token_obj = ActionToken.objects.select_for_update().get(
                id=token_uuid, is_used=False
            )
        except (ActionToken.DoesNotExist, ValidationError):
            return Response(
                {"token": "This invitation link has already been used or is invalid."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            work_order = serializer.save(tenant=token_obj.tenant)

            token_obj.is_used = True
            token_obj.save()

            return Response(
                {
                    "ticket_id": work_order.ticket_id,
                    "id": work_order.id,
                    "status": "success",
                },
                status=status.HTTP_201_CREATED,
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CreateActionLinkView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            profile = request.user.profile
            tenant = profile.tenant
            user_role = profile.role
        except AttributeError:
            return Response({"error": "User profile not found."}, status=403)

        requested_type = request.data.get('token_type')

        if requested_type == 'EMP_INVITE' and user_role not in ['ADMIN', 'OWNER']:
            return Response({
                "error": "Only shop owners or admins can invite new staff."
            }, status=403)

        phone_number = request.data.get('phone_number')
        if not phone_number:
            return Response({"error": "Phone number is required."}, status=400)

        role = request.data.get('role', 'TECHNICIAN')
        tech_level = request.data.get('tech_level', 'NONE')

        token = ActionToken.objects.create(
            tenant=tenant,
            phone_number=phone_number,
            token_type=requested_type,
            role=role,
            tech_level=tech_level,
        )

        serializer = ActionTokenSerializer(token)
        return Response(serializer.data, status=201)

@method_decorator(csrf_exempt, name='dispatch')
class ValidateOneClickView(generics.RetrieveAPIView):
    queryset = ActionToken.objects.all()
    serializer_class = ActionTokenSerializer
    permission_classes = [AllowAny]

    def get_object(self):
        token_uuid = (
            self.kwargs.get("pk")
            or self.kwargs.get("id")
            or self.kwargs.get("token_id")
        )
        try:
            return ActionToken.objects.get(id=token_uuid)
        except (ActionToken.DoesNotExist, ValidationError):
            raise NotFound(detail="This token does not exist or has expired.")
