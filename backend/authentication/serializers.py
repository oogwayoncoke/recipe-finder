from django.contrib.auth.models import User
from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from allauth.account.models import EmailAddress


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

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
       return super().get_token(user)
       
       try:
           profile = user.userprofile
           token['tenant_id'] = str(profile.tenant.tenant_id) if profile.tenant else None
       except Exception as e:
           if user.is_superuser or user.is_staff:
                token['tenant_id'] = "GLOBAL_ADMIN"
                token['role'] = "SUPERUSER"
           else:
                token['tenant_id'] = None
                token['role'] = "UNAUTHORIZED"
       return token
    
    
