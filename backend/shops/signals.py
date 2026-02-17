from django.db.models.signals import pre_save,post_save
from django.dispatch import receiver
from django.db import transaction
from .models.operations import PartUsage,WorkOrder,Inventory

@receiver(pre_save, sender=PartUsage)
def capture_part_price(sender, instance, **kwargs):
    if instance.pk is None and not instance.price_at_use:
        instance.price_at_use = instance.inventory_item.base_price
        
@receiver(post_save, sender=PartUsage)
def deduct_inventory(sender, instance, created, **kwargs):
    if created:
        with transaction.atomic():
            item = instance.inventory_item
            item.stocklevel -= instance.quantity_used
            item.save(update_fields=['stock_level'])
            
