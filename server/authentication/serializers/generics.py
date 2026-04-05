from allauth.account.models import EmailAddress
from django.contrib.auth import authenticate, get_user_model
from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.exceptions import AuthenticationFailed

from authentication.models import UserProfile

User = get_user_model()


# ── Registration ──────────────────────────────────────────────────────────────

class UserSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(
        required=True,
        validators=[
            UniqueValidator(
                queryset=User.objects.all(),
                message='A user with this email already exists.',
            )
        ],
    )
    username = serializers.CharField(
        required=True,
        validators=[
            UniqueValidator(
                queryset=User.objects.all(),
                message='A user with this username already exists.',
            )
        ],
    )
    password  = serializers.CharField(write_only=True, min_length=8)
    password2 = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model  = User
        fields = ['UUID', 'username', 'email', 'password', 'password2']

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError({'password2': 'Passwords do not match.'})
        return data

    def create(self, validated_data):
        validated_data.pop('password2')
        request = self.context.get('request')

        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            is_active=False,
        )

        # Create allauth email record and fire confirmation email
        email_obj, _ = EmailAddress.objects.get_or_create(
            user=user,
            email=user.email,
            defaults={'primary': True, 'verified': False},
        )
        email_obj.send_confirmation(request, signup=True)

        return user


# ── Token (login) ─────────────────────────────────────────────────────────────

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = User.USERNAME_FIELD  # 'email'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Accept either email or username — both optional individually
        self.fields['username'] = serializers.CharField(required=False)
        self.fields['email']    = serializers.EmailField(required=False)
        self.fields['password'] = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email    = attrs.get('email')
        username = attrs.get('username')
        password = attrs.get('password')

        # Resolve email from username if that's what was sent
        if not email and username:
            try:
                email = User.objects.get(username=username).email
            except User.DoesNotExist:
                raise AuthenticationFailed('No account found with this username.')

        if not email:
            raise AuthenticationFailed('Email or username is required.')

        user = authenticate(
            request=self.context.get('request'),
            email=email,
            password=password,
        )

        if not user:
            raise AuthenticationFailed('Invalid credentials.')

        if not user.is_active:
            raise AuthenticationFailed(
                'Account is not active. Please verify your email first.'
            )

        refresh = self.get_token(user)
        return {
            'refresh': str(refresh),
            'access':  str(refresh.access_token),
        }

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        
        # Add these two lines
        token['username'] = user.username
        token['email']    = user.email
        
        profile = getattr(user, 'profile', None)
        if profile:
            token['dietary_preferences'] = profile.get_dietary_list()
            token['allergies']           = profile.get_allergy_list()
        else:
            token['dietary_preferences'] = []
            token['allergies']           = []
        return token


# ── Profile ───────────────────────────────────────────────────────────────────

from rest_framework import serializers
from authentication.models import UserProfile

class UserProfileSerializer(serializers.ModelSerializer):
    # Pulling basic info from the related User model (read-only)
    username = serializers.ReadOnlyField(source='user.username')
    email = serializers.ReadOnlyField(source='user.email')
    

    class Meta:
        model = UserProfile
        fields = [
            'id', 
            'username', 
            'email', 
            'bio', 
            'dietary_preferences', 
            'allergies', 
            'avatar'
        ]
        read_only_fields = ['id', 'username', 'email']

    def to_representation(self, instance):
        """
        Override the default representation to convert the stored comma-separated 
        strings back into actual Python lists for the JSON response.
        """
        representation = super().to_representation(instance)

        # Convert 'vegan,keto' -> ['vegan', 'keto']
        if representation.get('dietary_preferences'):
            representation['dietary_preferences'] = [
                pref.strip() for pref in representation['dietary_preferences'].split(',') if pref.strip()
            ]
        else:
            representation['dietary_preferences'] = []

        # Convert 'peanuts,dairy' -> ['peanuts', 'dairy']
        if representation.get('allergies'):
            representation['allergies'] = [
                allergy.strip() for allergy in representation['allergies'].split(',') if allergy.strip()
            ]
        else:
            representation['allergies'] = []

        return representation