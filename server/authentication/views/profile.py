from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from authentication.models import UserProfile
from authentication.serializers.generics import UserProfileSerializer


def _get_profile(user):
    profile, _ = UserProfile.objects.get_or_create(user=user)
    return profile


class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile = _get_profile(request.user)
        serializer = UserProfileSerializer(profile, context={'request': request})
        return Response(serializer.data)

    def patch(self, request):
        profile = _get_profile(request.user)
        data = request.data

        if 'bio' in data:
            profile.bio = data['bio']

        if 'dietary_preferences' in data:
            prefs = data['dietary_preferences']
            # Accept either a list ["vegan","keto"] or a comma string "vegan,keto"
            if isinstance(prefs, list):
                profile.dietary_preferences = ','.join(prefs)
            else:
                profile.dietary_preferences = prefs

        if 'allergies' in data:
            allergies = data['allergies']
            if isinstance(allergies, list):
                profile.allergies = ','.join(allergies)
            else:
                profile.allergies = allergies

        profile.save()
        serializer = UserProfileSerializer(profile, context={'request': request})
        return Response(serializer.data)


class AvatarUploadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        avatar = request.FILES.get('avatar')
        if not avatar:
            return Response({'error': 'No file provided.'}, status=status.HTTP_400_BAD_REQUEST)

        allowed_types = ['image/jpeg', 'image/png', 'image/webp']
        if avatar.content_type not in allowed_types:
            return Response({'error': 'Only JPEG, PNG, and WebP are accepted.'}, status=status.HTTP_400_BAD_REQUEST)

        if avatar.size > 5 * 1024 * 1024:
            return Response({'error': 'Avatar must be under 5MB.'}, status=status.HTTP_400_BAD_REQUEST)

        profile = _get_profile(request.user)
        if profile.avatar:
            profile.avatar.delete(save=False)

        profile.avatar = avatar
        profile.save(update_fields=['avatar'])

        serializer = UserProfileSerializer(profile, context={'request': request})
        return Response(serializer.data)

    def delete(self, request):
        profile = _get_profile(request.user)
        if profile.avatar:
            profile.avatar.delete(save=False)
            profile.avatar = None
            profile.save(update_fields=['avatar'])
        return Response({'message': 'Avatar removed.'})
