from django.db.models.signals import pre_save,post_save
from django.dispatch import receiver
from django.db import transaction
from .models.operations import PartUsage,WorkOrder

@receiver(pre_save, sender=PartUsage)
def capture_part_price(sender, instance, **kwargs):
    if instance.pk is None and not instance.price_at_use:
        instance.price_at_use = instance.inventory_item.retail_price
        
@receiver(post_save, sender=PartUsage)
def drain_inventory_on_usage(sender, instance, created, **kwargs):
    if created:
        inventory_item = instance.inventory_item
        with transaction.atomic():
            if inventory_item.stock_count > 0:
                inventory_item.stock_count -= 1
                inventory_item.save(update_fields=['stock_count'])
            else:
                pass