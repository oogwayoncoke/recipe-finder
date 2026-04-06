import uuid
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models


# ---------------------------------------------------------------------------
# Custom User Manager
# ---------------------------------------------------------------------------

class UserManager(BaseUserManager):
    def create_user(self, email, username, password=None, **extra_fields):
        if not email:
            raise ValueError("Email is required")
        email = self.normalize_email(email)
        user = self.model(email=email, username=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, username, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, username, password, **extra_fields)


# ---------------------------------------------------------------------------
# User  (matches schema: UUID PK, Username, Email, Password)
# ---------------------------------------------------------------------------

class User(AbstractBaseUser, PermissionsMixin):
    """
    Custom user model with UUID primary key — matches schema's User.UUID.
    Must be set BEFORE the first migration:
        AUTH_USER_MODEL = 'your_app.User'
    """
    UUID     = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    username = models.CharField(max_length=150, unique=True)
    email    = models.EmailField(unique=True)

    # Django internals
    is_active   = models.BooleanField(default=True)
    date_joined = models.DateTimeField(auto_now_add=True)

    objects = UserManager()

    USERNAME_FIELD  = 'email'
    REQUIRED_FIELDS = ['username']

    class Meta:
        db_table = 'user'

    def __str__(self):
        return f'{self.username} ({self.UUID})'


# ---------------------------------------------------------------------------
# Lookup tables  (matches schema: diets, allergies)
# ---------------------------------------------------------------------------

class Diet(models.Model):
    """Matches schema: diets(ID, Name)"""
    name = models.CharField(max_length=100, unique=True)

    class Meta:
        db_table = 'diets'

    def __str__(self):
        return self.name


class Allergy(models.Model):
    """Matches schema: allergies(ID, Name)"""
    name = models.CharField(max_length=100, unique=True)

    class Meta:
        db_table = 'allergies'

    def __str__(self):
        return self.name


# ---------------------------------------------------------------------------
# Junction tables  (matches schema: user_diets, user_allergies)
# ---------------------------------------------------------------------------

class UserDiet(models.Model):
    """
    Matches schema: user_diets(UserUUID, dietsID)
    Explicit through-table so we stay schema-faithful.
    """
    user  = models.ForeignKey(User,  on_delete=models.CASCADE, db_column='UserUUID',  to_field='UUID')
    diet  = models.ForeignKey(Diet,  on_delete=models.CASCADE, db_column='dietsID')

    class Meta:
        db_table        = 'user_diets'
        unique_together = ('user', 'diet')

    def __str__(self):
        return f'{self.user.username} — {self.diet.name}'


class UserAllergy(models.Model):
    """
    Matches schema: user_allergies(UserUUID, allergiesID)
    """
    user    = models.ForeignKey(User,    on_delete=models.CASCADE, db_column='UserUUID',     to_field='UUID')
    allergy = models.ForeignKey(Allergy, on_delete=models.CASCADE, db_column='allergiesID')

    class Meta:
        db_table        = 'user_allergies'
        unique_together = ('user', 'allergy')

    def __str__(self):
        return f'{self.user.username} — {self.allergy.name}'


# ---------------------------------------------------------------------------
# UserProfile  (avatar/bio — extra UX layer, not in schema but non-breaking)
# ---------------------------------------------------------------------------

class UserProfile(models.Model):
    """
    Thin profile extension for UX fields (avatar, bio).
    Diets and allergies are now handled via UserDiet / UserAllergy.
    """
    user       = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile', to_field='UUID')
    avatar     = models.ImageField(upload_to='avatars/', null=True, blank=True)
    bio        = models.TextField(max_length=300, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'user_profile'

    def __str__(self):
        return f'{self.user.username} — profile'

    # Convenience helpers — hit the proper tables now
    def get_dietary_list(self):
        return list(self.user.userdiet_set.values_list('diet__name', flat=True))

    def get_allergy_list(self):
        return list(self.user.userallergy_set.values_list('allergy__name', flat=True))