from django.db.models.signals import pre_save,post_save
from django.dispatch import receiver
from django.db import transaction
from .models.operations import PartUsage,WorkOrder,StatusHistory,Inventory

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
            
@receiver(pre_save, sender=WorkOrder)
def track_status_history(sender, instance, **kwargs):
    if instance.pk:
        try:
            old_instance = WorkOrder.objects.get(pk=instance.pk)
            if old_instance.status != instance.status:
                StatusHistory.objects.create(work_order=instance,
                old_status=old_instance.status,
                new_status=instance.status,
                technician=instance.assigned_tech
                )
        
        except WorkOrder.DoesNotExist:
            pass
@receiver(post_save, sender=WorkOrder)
def trigger_notifications(sender, instance, created, **kwargs):
    if not created:
        if instance.status == 'ready':
            transaction.on_commit(lambda:print(f"DUMMY: Sending WhatsApp to customer for Job {instance.qr_code_key[:8]}"))