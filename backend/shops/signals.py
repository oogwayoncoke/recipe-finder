from django.db import transaction
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver

from .models.operations import PartUsage, WorkOrder


@receiver(pre_save, sender=PartUsage)
def capture_part_price(sender, instance, **kwargs):
    if instance.pk is None and not instance.price_at_use:
        instance.price_at_use = instance.inventory_item.retail_price


@receiver(post_save, sender=PartUsage)
def execute_part_deployment(sender, instance, created, **kwargs):
    if created:
        inventory_item = instance.inventory_item
        work_order = instance.work_order

        with transaction.atomic():
            if inventory_item.stock_count > 0:
                inventory_item.stock_count -= instance.quantity_used
                inventory_item.save(update_fields=['stock_count'])

            if work_order.status in ["diagnosing", "parts"]:
                work_order.status = "working"
                work_order.save(update_fields=["status"])
