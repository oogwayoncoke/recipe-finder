import requests
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()

GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo'


def _get_or_create_google_user(google_data: dict):
    email     = google_data.get('email', '').lower().strip()
    name      = google_data.get('name', '')

    if not email:
        raise ValueError('Google account has no email address.')

    user, created = User.objects.get_or_create(
        email=email,
        defaults={
            'username':  _unique_username(email, name),
            'is_active': True,  # Google already verified the email
        },
    )
    return user, created


def _unique_username(email: str, name: str) -> str:
    base     = (name.replace(' ', '').lower() or email.split('@')[0])[:28]
    username = base
    counter  = 1
    while User.objects.filter(username=username).exists():
        username = f'{base}{counter}'
        counter += 1
    return username


def _jwt_for_user(user) -> dict:
    refresh             = RefreshToken.for_user(user)
    refresh['username'] = user.username
    refresh['email']    = user.email
    try:
        profile = user.userprofile
        refresh['dietary_preferences'] = list(
            profile.dietary_preferences.values_list('name', flat=True)
        )
        refresh['allergies'] = list(
            profile.allergies.values_list('name', flat=True)
        )
    except Exception:
        refresh['dietary_preferences'] = []
        refresh['allergies']           = []
    return {
        'access':  str(refresh.access_token),
        'refresh': str(refresh),
    }


class GoogleLoginView(APIView):
    """
    POST /api/authentication/google/
    Body:    { "access_token": "<google_oauth_access_token>" }
    Returns: { "access": "...", "refresh": "...", "created": bool }
    """
    permission_classes = [AllowAny]

    def post(self, request):
        access_token = request.data.get('access_token', '').strip()
        if not access_token:
            return Response(
                {'error': 'access_token is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Verify with Google + fetch user info in one call
        res = requests.get(
            GOOGLE_USERINFO_URL,
            headers={'Authorization': f'Bearer {access_token}'},
            timeout=8,
        )
        if res.status_code != 200:
            return Response(
                {'error': 'Invalid or expired Google token.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        google_data = res.json()

        try:
            user, created = _get_or_create_google_user(google_data)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            {**_jwt_for_user(user), 'created': created},
            status=status.HTTP_200_OK,
        )