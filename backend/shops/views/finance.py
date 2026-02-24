from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from ..serializers.finance import FinanceSummarySerializer


class FinanceSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile = getattr(request.user, "profile", None)

        if not profile or profile.role != "OWNER":
            return Response(
                {"detail": "Access restricted to shop owners."},
                status=status.HTTP_403_FORBIDDEN,
            )

        tenant = profile.tenant
        serializer = FinanceSummarySerializer()
        data = serializer.get_summary(tenant)

        return Response(data, status=status.HTTP_200_OK)
