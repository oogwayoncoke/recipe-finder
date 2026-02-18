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
       
       try:
            profile = UserProfile.objects.filter(user=user).first()
            
            if profile:
                token['tenant_id'] = str(profile.tenant.tenant_id)
                token['role'] = profile.role
                print(f"--- SUCCESS: Token updated for {user.username} ---")
            else:
                token['tenant_id'] = None
                token['role'] = "UNAUTHORIZED"
                print(f"--- WARNING: No profile found for {user.username} in database ---")
                
       except Exception as e:
            print(f"--- SERIALIZER ERROR: {str(e)} ---")
            
       return token
    
       return user