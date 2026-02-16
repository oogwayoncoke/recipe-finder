from django.contrib.auth.models import User
from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from allauth.account.utils import setup_user_email
from allauth.account.models import EmailAddress


class UserSerializer(serializers.ModelSerializer):
  email = serializers.EmailField(
        required=True,
        validators=[UniqueValidator(queryset=User.objects.all(), message="A user with this email already exists.")])
  class Meta:
    model = User
    fields = ["id", "username","email","password"]
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
    


    try:
        email_obj.send_confirmation(request, signup=True)
        print("--- EMAIL SENT TO CONSOLE SUCCESSFULLY ---")
    except Exception as e:
        print(f"--- EMAIL FAILED: {str(e)} ---")
    
    return user