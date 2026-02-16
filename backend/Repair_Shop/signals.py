from django.db.models.signals import pre_save
from django.dispatch import receiver
from .models import PartUsage

@receiver(pre_save, sender=PartUsage)
def capture_part_price(sender, instance, **kwargs):
    if instance.pk is None and not instance.price_at_use:
        instance.price_at_use = instance.inventory_item.base_price