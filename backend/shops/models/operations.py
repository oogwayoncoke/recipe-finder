from django.db import models
from .base import TenantModel
import uuid

class WorkOrder(TenantModel):
  STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('diagnosing', 'In Diagnosis'),
        ('parts', 'Waiting for Parts'),
        ('ready', 'Ready for Pickup'),
        ('completed', 'Completed'),
    ]
  item = models.ForeignKey('shops.Item', on_delete=models.CASCADE, null=False, 
                           related_name='work_order')
  description = models.CharField(max_length=255, null=True)
  estimate_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
  qr_code_key = models.CharField(
        max_length=50, 
        unique=True, 
        db_index=True, 
        editable=False, 
        default=uuid.uuid4)
  assigned_tech = models.ForeignKey('shops.Technician', on_delete=models.SET_NULL, 
                                    null=True, 
                                    blank=True)
  status = models.CharField(max_length=20, choices=STATUS_CHOICES, 
                                   default= 'pending',
                                   null=False)
  created_at = models.DateTimeField(auto_now_add=True)
  
  def __str__(self):
    return f'order#{self.id} - {self.item.device_type} ({self.status})'
  
class Inventory(models.Model):
  part_name = models.CharField(max_length=255, null=False)
  stock_level= models.IntegerField(default=0, null=False)
  base_price = models.DecimalField(max_digits=10,decimal_places=2, null=False)
  reorder_point = models.IntegerField(default=5)
  
  def __str__(self):
    return f'{self.part_name} - {self.stock_level} in stock'
  
class PartUsage(models.Model):
  work_order = models.ForeignKey(WorkOrder, on_delete=models.CASCADE,null=False)
  inventory_item = models.ForeignKey(Inventory, on_delete=models.CASCADE, null=False, 
                                     related_name='parts_used')
  technician = models.ForeignKey('shops.Technician',on_delete=models.CASCADE, null=True, blank=True)
  quantity_used = models.IntegerField(default=1, null= False)
  price_at_use = models.DecimalField(max_digits=10, decimal_places=2, editable=False,
                                     null=True,
                                     blank=True)
  
class Service(models.Model):
   work_order = models.ForeignKey(WorkOrder, on_delete=models.CASCADE,null=False)
   service_name = models.CharField(max_length=255, null=False)
   cost = models.DecimalField(max_digits=10, decimal_places=2, null=False)
   
   
class StatusUpdate(TenantModel):
    # Cannot exist without the WorkOrder 
    work_order = models.ForeignKey(WorkOrder, on_delete=models.CASCADE, related_name='history')
    status_label = models.CharField(max_length=50) 
    note = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
