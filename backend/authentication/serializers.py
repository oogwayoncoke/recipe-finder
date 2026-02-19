from django.contrib.auth.models import User
from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from allauth.account.models import EmailAddress
from .models import UserProfile

class UserSerializer(serializers.ModelSerializer):
  shop_name = serializers.CharField(write_only=True, required=False)
  invite_token = serializers.CharField(write_only=True, required=False)
  email = serializers.EmailField(
        required=True,
        validators=[UniqueValidator(queryset=User.objects.all(), message="A user with this email already exists.")])
  class Meta:
    model = User
    fields = ["id", "username", "email", "password", "shop_name", "invite_token"]
    extra_kwargs = {"password" :{"write_only":True}}
    
  def create(self, validated_data):
    user = User.objects.create_user(
        username=validated_data['username'],
        password=validated_data['password'],
        email=validated_data['email'],
        is_active=False
    )
    
    request = self.context.get('request')
    email_obj, created = EmailAddress.objects.get_or_create(
        user=user, 
        email=user.email, 
        defaults={'primary': True, 'verified': False}
    )
    email_obj.send_confirmation(request, signup=True)
    return user
    
class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
       token = super().get_token(user)
       
       profile = UserProfile.objects.filter(user=user).first()
            
       if profile:
           token['tenant_id'] = str(profile.tenant.tenant_id)
           token['role'] = profile.role
            
       else:
           token['tenant_id'] = None
           token['role'] = "UNAUTHORIZED"
               
            
       return token

class StaffRegistrationSerializer(serializers.ModelSerializer):
    invite_token = serializers.UUIDField(write_only=True)

    class Meta:
        model = User
        fields = ["username", "email", "password", "invite_token"]
        extra_kwargs = {"password": {"write_only": True}}

    def validate_invite_token(self, value):

        try:
            invitation = Invitation.objects.get(token=value, is_used=False)
        except Invitation.DoesNotExist:
            raise serializers.ValidationError("Invalid or already used invitation token.")

        if not invitation.is_valid():
            raise serializers.ValidationError("This invitation link has expired.")
        
        return invitation

    def create(self, validated_data):
        invitation = validated_data.pop('invite_token')
        
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            is_active=True 
        )
        

        UserProfile.objects.create(
            user=user,
            tenant=invitation.tenant,
            role=invitation.role 
        )
        

        invitation.is_used = True
        invitation.save()
        
        return user
