from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework.views import APIView
from rest_framework import status, views, generics
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from .models import WorkOrder
from .serializers import WorkOrderCreateSerializer,ActionTokenSerializer
from authentication.models import UserProfile,User
from .models.auth import ActionToken
from authentication.models import UserProfile
class WorkOrderCreateView(generics.CreateAPIView):
    queryset = WorkOrder.objects.all()
    
    serializer_class = WorkOrderCreateSerializer
    permission_classes = [IsAuthenticated]
    
    def perform_create(self, serializer):
        serializer.save()
        

from .serializers import ActionTokenSerializer




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
class ValidateOneClickView(APIView):

    permission_classes = [] 
    authentication_classes = [] 

    def post(self, request, token_id):
        token = get_object_or_404(ActionToken, id=token_id)
        if token.is_used:
            return Response({"error": "This link has already been used."}, status=400)
        

        user_exists = User.objects.filter(username=token.phone_number).exists()
        
        user, created = User.objects.get_or_create(username=token.phone_number)

  
        UserProfile.objects.update_or_create(
            user=user,
            defaults={
                'tenant': token.tenant,
                'role': 'TECH' if token.token_type == 'EMP_INVITE' else 'CUSTOMER',
                'tech_level': token.tech_level
            }
        )

        refresh = RefreshToken.for_user(user)
        refresh['tenant_id'] = str(token.tenant.tenant_id)
        refresh['role'] = 'TECH' if token.token_type == 'EMP_INVITE' else 'CUSTOMER'
        
        token.is_used = True
        token.save()

        return Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "is_new_user": not user_exists or not user.has_usable_password(), # <--- Key flag
            "redirect_to": "/setup-profile" if (not user_exists or not user.has_usable_password()) else "/dashboard"
        }, status=200)