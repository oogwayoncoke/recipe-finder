import traceback  # Add this at the top

from authentication.models import UserProfile
from authentication.serializers.generics import UserProfileSerializer
from rest_framework import generics, permissions
from rest_framework.response import Response


class OstaListView(generics.ListAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        try:
            user = self.request.user
            profile = getattr(user, "profile", None)

            if not profile:
                print("--- DEBUG: No profile found for this user! ---")
                return UserProfile.objects.none()

            # The crash likely happens here:
            return UserProfile.objects.filter(
                tenant=profile.tenant, role="TECH", tech_level="OSTA"
            )
        except Exception as e:
            print("--- OSTA LIST CRASH TRACEBACK ---")
            traceback.print_exc()
            return UserProfile.objects.none()


class SabiListView(generics.ListAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        user_profile = getattr(user, "profile", None)

        if not user_profile or not user_profile.tenant:
            return UserProfile.objects.none()

        return UserProfile.objects.filter(
            tenant=user_profile.tenant, role="TECH", tech_level="SABI"
        )


class UserProfileDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user_profile = getattr(self.request.user, "profile", None)
        if not user_profile:
            return UserProfile.objects.none()
        return UserProfile.objects.filter(tenant=user_profile.tenant)


class StaffTreasuryListView(generics.ListAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user_profile = getattr(self.request.user, "profile", None)
        if not user_profile or not user_profile.tenant:
            return UserProfile.objects.none()
        return UserProfile.objects.filter(
            tenant=user_profile.tenant, tech_level__in=["OSTA", "SABI"]
        )
