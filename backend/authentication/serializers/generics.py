from allauth.account.models import EmailAddress
from django.contrib.auth.models import User
from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from shops.models import Technician

from ..models import UserProfile


class UserSerializer(serializers.ModelSerializer):
    shop_name = serializers.CharField(write_only=True, required=False)
    invite_token = serializers.CharField(write_only=True, required=False)
    email = serializers.EmailField(
        required=True,
        validators=[
            UniqueValidator(
                queryset=User.objects.all(),
                message="A user with this email already exists.",
            )
        ],
    )

    class Meta:
        model = User
        fields = ["id", "username", "email", "password", "shop_name", "invite_token"]
        extra_kwargs = {"password": {"write_only": True}}

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data["username"],
            password=validated_data["password"],
            email=validated_data["email"],
            is_active=False,
        )

        request = self.context.get("request")
        email_obj, created = EmailAddress.objects.get_or_create(
            user=user, email=user.email, defaults={"primary": True, "verified": False}
        )
        email_obj.send_confirmation(request, signup=True)
        return user


class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        profile = getattr(user, 'profile', None)

        if profile:
            token['tenant_id'] = str(profile.tenant.tenant_id) if profile.tenant else None
            token['role'] = profile.role
            token['tech_level'] = profile.tech_level
        else:
            token['role'] = "UNAUTHORIZED"

        return token


class UserProfileSerializer(serializers.ModelSerializer):
    # This line tells Django: "Go to the linked 'user' and get their 'username'"
    username = serializers.ReadOnlyField(source="user.username")

    # Optional: Keep 'user' (the ID) so we can link it in React
    user = serializers.ReadOnlyField(source="user.id")

    class Meta:
        model = UserProfile
        fields = ["id", "user", "username", "role", "tech_level"]
