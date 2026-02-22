import datetime

from django.db import models

from .base import TenantModel


def generate_ticket_id():
    import datetime
    year = datetime.datetime.now().strftime('%y')
    last_order = WorkOrder.objects.filter(ticket_id__contains=f'SR-{year}').order_by('id').last()
    
    if not last_order:
        return f'SR-{year}-0001'
    
    last_ticket_number = int(last_order.ticket_id.split('-')[-1])
    new_number = last_ticket_number + 1
    return f'SR-{year}-{new_number:04d}'

class WorkOrder(TenantModel):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("diagnosing", "In Diagnosis"),
        ("parts", "Waiting for Parts"),
        ("ready", "Ready for Pickup"),
        ("completed", "Completed"),
    ]

    PART_QUALITY_CHOICES = [
        ("original", "Original"),
        ("high_copy", "High Copy"),
        ("used_pull", "Used/Pull"),
        ("none", "N/A"),
    ]

    item = models.ForeignKey(
        "shops.Item", on_delete=models.CASCADE, null=False, related_name="work_order"
    )
    description = models.CharField(max_length=255, null=True)
    internal_notes = models.TextField(blank=True)
    estimate_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    deposit_paid = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    assigned_sabi_tech = models.ForeignKey(
        "authentication.UserProfile",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="osta_tasks",
        limit_choices_to={"role": "TECH", "tech_level": "OSTA"},
    )
    assigned_osta_tech = models.ForeignKey(
        "authentication.UserProfile",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="sabi_tasks",
        limit_choices_to={"role": "TECH", "tech_level": "SABI"},
    )
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default="pending", null=False
    )
    part_quality = models.CharField(
        max_length=20, choices=PART_QUALITY_CHOICES, default="none"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    ticket_id = models.CharField(max_length=20, unique=True, editable=False, blank=True)

    def save(self, *args, **kwargs):
        if not self.ticket_id:
            self.ticket_id = generate_ticket_id()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"order#{self.id} - {self.item.device_type} ({self.status})"


class Inventory(TenantModel):
    PRODUCT_TYPES = (
        ('PART', 'Repair Part'),
        ('RETAIL', 'Retail Product'),
    )

    name = models.CharField(max_length=255)
    sku = models.CharField(max_length=100, blank=True, null=True)

    product_type = models.CharField(
        max_length=10, 
        choices=PRODUCT_TYPES, 
        default='RETAIL'
    )

    cost_price = models.DecimalField(max_digits=10, decimal_places=2)
    retail_price = models.DecimalField(max_digits=10, decimal_places=2)

    stock_count = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    specifications = models.JSONField(default=dict, blank=True)

    class Meta:
        unique_together = ('tenant', 'sku')

    def __str__(self):
        return f"{self.name} ({self.stock_count})"

class PartUsage(TenantModel):
    work_order = models.ForeignKey(WorkOrder, on_delete=models.CASCADE, null=False)
    inventory_item = models.ForeignKey(
        Inventory, on_delete=models.CASCADE, null=False, related_name="parts_used"
    )
    technician = models.ForeignKey(
        "shops.Technician", on_delete=models.CASCADE, null=True, blank=True
    )
    quantity_used = models.IntegerField(default=1, null=False)
    price_at_use = models.DecimalField(
        max_digits=10, decimal_places=2, editable=False, null=True, blank=True
    )

class Service(TenantModel):
    work_order = models.ForeignKey(WorkOrder, on_delete=models.CASCADE, null=False)
    service_name = models.CharField(max_length=255, null=False)
    cost = models.DecimalField(max_digits=10, decimal_places=2, null=False)


class StatusUpdate(TenantModel):
    work_order = models.ForeignKey(WorkOrder, on_delete=models.CASCADE, related_name='history')
    status_label = models.CharField(max_length=50) 
    note = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
