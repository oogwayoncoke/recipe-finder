from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework.views import APIView
from rest_framework import generics
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from ..models import WorkOrder
from ..serializers.invites import ActionTokenSerializer
from authentication.serializers.registration import CustomerOnboardSerializer
from authentication.models import UserProfile,User
from ..models.auth import ActionToken
from authentication.models import UserProfile
from rest_framework.permissions import AllowAny
from rest_framework.exceptions import NotFound




class WorkOrderCreateView(generics.CreateAPIView):
    queryset = WorkOrder.objects.all()
    
    serializer_class = CustomerOnboardSerializer
    permission_classes = [IsAuthenticated]
    
    def perform_create(self, serializer):
        serializer.save()
        


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
        role = request.data.get('role', 'TECHNICIAN')
        tech_level = request.data.get('tech_level', 'NONE')
        
        token = ActionToken.objects.create(
            tenant=tenant,
            phone_number=phone_number,
            token_type=requested_type,
            role=role,
            tech_level=tech_level
        )

        if not phone_number:
            return Response({"error": "Phone number is required."}, status=400)
        
        
        
        serializer = ActionTokenSerializer(token)
        return Response(serializer.data, status=201)
    
User = get_user_model()
@method_decorator(csrf_exempt, name='dispatch')
class ValidateOneClickView(generics.RetrieveAPIView):
    queryset = ActionToken.objects.all()
    serializer_class = ActionTokenSerializer
    permission_classes = [AllowAny]

    def get_object(self):
        # 1. Grab whatever variable the URL passed
        # This will work whether urls.py uses <uuid:pk>, <uuid:id>, or <uuid:token_id>
        token_uuid = self.kwargs.get('pk') or self.kwargs.get('id') or self.kwargs.get('token_id')
        
        # 2. explicitly query the database using the 'id' column
        try:
            return ActionToken.objects.get(id=token_uuid)
        except ActionToken.DoesNotExist:
            raise NotFound(detail="This token does not exist or has expired.")