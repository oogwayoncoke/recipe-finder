from django.apps import apps
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
from shops.models import Technician

from .models import UserProfile


@receiver(post_save, sender=UserProfile)
def sync_technician_record(sender, instance, created, **kwargs):
    if instance.role == "TECH":
        Technician.objects.get_or_create(
            full_name=instance.user.username,
            tenant=instance.tenant,
            defaults={"role": instance.tech_level},
        )


@receiver(post_save, sender=User)
def manage_user_profile(sender, instance, created, **kwargs):
    UserProfile = apps.get_model("authentication", "UserProfile")

    if created:
        UserProfile.objects.get_or_create(user=instance)
    else:
        if hasattr(instance, "profile"):
            instance.profile.save()
