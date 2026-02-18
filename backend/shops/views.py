from rest_framework import status, views
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models.base import Invitation
from .serializers import InvitationSerializer
from authentication.models import UserProfile

class GenerateInvitationView(views.APIView):
  permission_classes = [IsAuthenticated]
  
  def post(self, request):
        try:
            user_profile = UserProfile.objects.get(user=request.user)
        except UserProfile.DoesNotExist:
            return Response({"error": "Profile not found."}, status=404)

        # 1. GET THE INPUTS
        # Look at what they actually sent in the JSON body
        requested_role = request.data.get('role')

        if user_profile.role == 'TECH' and  requested_role != 'CUSTOMER':

          
                return Response(
                    {"error": "Access Denied: Technicians are restricted to Customer intake only."}, 
                    status=status.HTTP_403_FORBIDDEN
                )

        serializer = InvitationSerializer(data=request.data)
        if serializer.is_valid():
            requested_tech_level = request.data.get('tech_level', 'NONE')
            invite = serializer.save(
                tenant=user_profile.tenant,
                role='CUSTOMER' if user_profile.role == 'TECH' else requested_role,
                tech_level=requested_tech_level if user_profile.role == 'OWNER' else 'NONE'
            )
            
            
            return Response({
                "message": f"{invite.role} invitation generated",
                "token": invite.token
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)