from django.apps import apps
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver


@receiver(post_save, sender=User)
def manage_user_profile(sender, instance, created, **kwargs):
    UserProfile = apps.get_model("authentication", "UserProfile")

    if created:
        UserProfile.objects.get_or_create(user=instance)
    else:
        if hasattr(instance, "profile"):
            instance.profile.save()
