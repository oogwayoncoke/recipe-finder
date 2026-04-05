from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from authentication.models import UserProfile, UserDiet, UserAllergy, Diet, Allergy
from .serializers import (
    ProfileSerializer, ProfileUpdateSerializer,
    DietSerializer, AllergySerializer,
)


# ── Helper ────────────────────────────────────────────────────────────────────

def _get_or_create_profile(user):
    profile, _ = UserProfile.objects.get_or_create(user=user)
    return profile


# ── Profile ───────────────────────────────────────────────────────────────────

class ProfileView(APIView):
    """
    GET   /profiles/me/   → return the authenticated user's full profile
    PATCH /profiles/me/   → update bio, username, diets, and/or allergies
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile    = _get_or_create_profile(request.user)
        serializer = ProfileSerializer(profile, context={'request': request})
        return Response(serializer.data)

    def patch(self, request):
        serializer = ProfileUpdateSerializer(
            data=request.data, context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        data    = serializer.validated_data
        user    = request.user
        profile = _get_or_create_profile(user)

        # ── bio ──────────────────────────────────────────────
        if 'bio' in data:
            profile.bio = data['bio']
            profile.save(update_fields=['bio', 'updated_at'])

        # ── username ─────────────────────────────────────────
        if 'username' in data:
            user.username = data['username']
            user.save(update_fields=['username'])

        # ── diets — replace the user's full diet set ──────────
        if 'diets' in data:
            UserDiet.objects.filter(user=user).delete()
            UserDiet.objects.bulk_create([
                UserDiet(user=user, diet=diet)
                for diet in data['diets']
            ])

        # ── allergies — replace the user's full allergy set ──
        if 'allergies' in data:
            UserAllergy.objects.filter(user=user).delete()
            UserAllergy.objects.bulk_create([
                UserAllergy(user=user, allergy=allergy)
                for allergy in data['allergies']
            ])

        profile.refresh_from_db()
        return Response(
            ProfileSerializer(profile, context={'request': request}).data
        )


# ── Avatar ────────────────────────────────────────────────────────────────────

class AvatarView(APIView):
    """
    POST   /profiles/me/avatar/  → upload a new avatar (multipart/form-data)
    DELETE /profiles/me/avatar/  → remove avatar
    """
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

        # Delete old file from disk before replacing
        if profile.avatar:
            profile.avatar.delete(save=False)

        profile.avatar = avatar
        profile.save(update_fields=['avatar', 'updated_at'])

        return Response(
            ProfileSerializer(profile, context={'request': request}).data,
            status=status.HTTP_200_OK,
        )

    def delete(self, request):
        profile = _get_or_create_profile(request.user)
        if profile.avatar:
            profile.avatar.delete(save=False)
            profile.avatar = None
            profile.save(update_fields=['avatar', 'updated_at'])
        return Response({'message': 'Avatar removed.'}, status=status.HTTP_200_OK)


# ── Diet & Allergy option lists (public — used by onboarding dropdowns) ───────

class DietListView(APIView):
    """
    GET /profiles/diets/
    Returns all available diet options.
    Public — no auth needed so the onboarding screen can load them
    before the user has signed in.
    """
    permission_classes     = [AllowAny]
    authentication_classes = []

    def get(self, request):
        diets = Diet.objects.all().order_by('name')
        return Response(DietSerializer(diets, many=True).data)


class AllergyListView(APIView):
    """
    GET /profiles/allergies/
    Returns all available allergy options. Public for the same reason.
    """
    permission_classes     = [AllowAny]
    authentication_classes = []

    def get(self, request):
        allergies = Allergy.objects.all().order_by('name')
        return Response(AllergySerializer(allergies, many=True).data)
