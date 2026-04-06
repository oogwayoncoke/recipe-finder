from rest_framework import serializers
from authentication.models import UserProfile, Diet, Allergy, UserDiet, UserAllergy


class DietSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Diet
        fields = ['id', 'name']


class AllergySerializer(serializers.ModelSerializer):
    class Meta:
        model  = Allergy
        fields = ['id', 'name']


class ProfileSerializer(serializers.ModelSerializer):
    """
    Read serializer — returns full profile including resolved diet
    and allergy names, plus avatar URL built from the request context.
    """
    username  = serializers.ReadOnlyField(source='user.username')
    email     = serializers.ReadOnlyField(source='user.email')
    avatar_url = serializers.SerializerMethodField()
    diets     = serializers.SerializerMethodField()
    allergies = serializers.SerializerMethodField()

    class Meta:
        model  = UserProfile
        fields = [
            'username', 'email',
            'bio', 'avatar_url',
            'diets', 'allergies',
            'updated_at',
        ]

    def get_avatar_url(self, obj):
        request = self.context.get('request')
        if obj.avatar and request:
            return request.build_absolute_uri(obj.avatar.url)
        return None

    def get_diets(self, obj):
        return list(
            UserDiet.objects.filter(user=obj.user)
            .select_related('diet')
            .values_list('diet__name', flat=True)
        )

    def get_allergies(self, obj):
        return list(
            UserAllergy.objects.filter(user=obj.user)
            .select_related('allergy')
            .values_list('allergy__name', flat=True)
        )


class ProfileUpdateSerializer(serializers.Serializer):
    """
    Write serializer — validates PATCH /profiles/me/ body.
    All fields optional so partial updates work naturally.
    """
    bio       = serializers.CharField(max_length=300, required=False, allow_blank=True)
    username  = serializers.CharField(max_length=150, required=False)
    diets     = serializers.ListField(
        child=serializers.CharField(), required=False,
        help_text='List of diet names e.g. ["vegan", "keto"]',
    )
    allergies = serializers.ListField(
        child=serializers.CharField(), required=False,
        help_text='List of allergy names e.g. ["gluten", "dairy"]',
    )

    def validate_username(self, value):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        user = self.context['request'].user
        if User.objects.exclude(pk=user.pk).filter(username=value).exists():
            raise serializers.ValidationError('This username is already taken.')
        return value

    def validate_diets(self, names):
        """Resolve diet names → Diet objects, raise if any name is unknown."""
        objs = []
        for name in names:
            try:
                objs.append(Diet.objects.get(name__iexact=name))
            except Diet.DoesNotExist:
                raise serializers.ValidationError(f'Unknown diet: "{name}".')
        return objs

    def validate_allergies(self, names):
        objs = []
        for name in names:
            try:
                objs.append(Allergy.objects.get(name__iexact=name))
            except Allergy.DoesNotExist:
                raise serializers.ValidationError(f'Unknown allergy: "{name}".')
        return objs
