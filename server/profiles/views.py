from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from authentication.models import UserProfile, UserDiet, UserAllergy, Diet, Allergy
from .serializers import (
    ProfileSerializer, ProfileUpdateSerializer,
    DietSerializer, AllergySerializer,
)


def _get_or_create_profile(user):
    profile, _ = UserProfile.objects.get_or_create(user=user)
    return profile


class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile    = _get_or_create_profile(request.user)
        serializer = ProfileSerializer(profile, context={'request': request})
        return Response(serializer.data)

    def patch(self, request):
        serializer = ProfileUpdateSerializer(
            data=request.data, context={'request': request}
        )

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data    = serializer.validated_data
        user    = request.user
        profile = _get_or_create_profile(user)

        # bio
        if 'bio' in data:
            profile.bio = data['bio']
            profile.save()

        # username: Check request.data to bypass DRF stripping unmapped fields
        if 'username' in request.data:
            user.username = request.data['username']
            user.save()
            profile.user.refresh_from_db()  # ← clears Django's ORM cache

        # diets
        if 'diets' in data:
            UserDiet.objects.filter(user=user).delete()
            UserDiet.objects.bulk_create([
                UserDiet(user=user, diet=diet)
                for diet in data['diets']
            ])

        # allergies
        if 'allergies' in data:
            UserAllergy.objects.filter(user=user).delete()
            UserAllergy.objects.bulk_create([
                UserAllergy(user=user, allergy=allergy)
                for allergy in data['allergies']
            ])

        profile.refresh_from_db()
        response_data = ProfileSerializer(profile, context={'request': request}).data
        return Response(response_data)


class AvatarView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        avatar = request.FILES.get('avatar')
        if not avatar:
            return Response(
                {'error': 'No file provided.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        allowed_types = ['image/jpeg', 'image/png', 'image/webp']
        if avatar.content_type not in allowed_types:
            return Response(
                {'error': 'Only JPEG, PNG, and WebP are accepted.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if avatar.size > 5 * 1024 * 1024:
            return Response(
                {'error': 'Avatar must be under 5 MB.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        profile = _get_or_create_profile(request.user)

        if profile.avatar:
            profile.avatar.delete(save=False)

        profile.avatar = avatar
        profile.save()

        return Response(
            ProfileSerializer(profile, context={'request': request}).data,
            status=status.HTTP_200_OK,
        )

    def delete(self, request):
        profile = _get_or_create_profile(request.user)
        if profile.avatar:
            profile.avatar.delete(save=False)
            profile.avatar = None
            profile.save()
        return Response({'message': 'Avatar removed.'}, status=status.HTTP_200_OK)


class DietListView(APIView):
    permission_classes     = [AllowAny]
    authentication_classes = []

    def get(self, request):
        diets = Diet.objects.all().order_by('name')
        return Response(DietSerializer(diets, many=True).data)


class AllergyListView(APIView):
    permission_classes     = [AllowAny]
    authentication_classes = []

    def get(self, request):
        allergies = Allergy.objects.all().order_by('name')
        return Response(AllergySerializer(allergies, many=True).data)