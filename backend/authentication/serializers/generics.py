from allauth.account.models import EmailAddress
from django.contrib.auth.models import User
from django.db import models
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
            token["staff_id"] = str(profile.id)
            token['tenant_id'] = str(profile.tenant.tenant_id) if profile.tenant else None
            token['role'] = profile.role
            token['tech_level'] = profile.tech_level
        else:
            token['role'] = "UNAUTHORIZED"

        return token


class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.ReadOnlyField(source="user.username")
    user_id = serializers.ReadOnlyField(source="user.id")
    hourly_rate = serializers.DecimalField(
        max_digits=10, decimal_places=2, required=False
    )

    class Meta:
        model = UserProfile
        fields = [
            "id",
            "user_id",
            "user",
            "username",
            "role",
            "tech_level",
            "hourly_rate",
        ]

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        tech = Technician.objects.filter(
            full_name=instance.user.username, tenant=instance.tenant
        ).first()
        ret["hourly_rate"] = tech.hourly_rate if tech else 0.00
        return ret

    def update(self, instance, validated_data):
        new_rate = validated_data.pop("hourly_rate", None)
        instance = super().update(instance, validated_data)

        if new_rate is not None:
            tech, created = Technician.objects.get_or_create(
                full_name=instance.user.username,
                tenant=instance.tenant,
                defaults={"role": instance.tech_level, "hourly_rate": new_rate},
            )
            if not created:
                tech.hourly_rate = new_rate
                tech.save()
        return instance
