from django.db import models
from .base import TenantModel
import datetime

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
        ('pending', 'Pending'),
        ('diagnosing', 'In Diagnosis'),
        ('parts', 'Waiting for Parts'),
        ('ready', 'Ready for Pickup'),
        ('completed', 'Completed'),
    ]
  
  PART_QUALITY_CHOICES = [
        ('original', 'Original'),
        ('high_copy', 'High Copy'),
        ('used_pull', 'Used/Pull'),
        ('none', 'N/A'),
    ]
  
  item = models.ForeignKey('shops.Item', on_delete=models.CASCADE, null=False, 
                           related_name='work_order')
  description = models.CharField(max_length=255, null=True)
  internal_notes = models.TextField(blank=True)
  estimate_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
  deposit_paid = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
  assigned_tech = models.ForeignKey(
        'authentication.UserProfile', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        limit_choices_to={'role': 'TECH'}
    )
  status = models.CharField(max_length=20, choices=STATUS_CHOICES, 
                                   default= 'pending',
                                   null=False)
  part_quality = models.CharField(max_length=20, choices=PART_QUALITY_CHOICES, default='none')
  created_at = models.DateTimeField(auto_now_add=True)
  updated_at = models.DateTimeField(auto_now=True)
  ticket_id = models.CharField(
      max_length=20, 
      unique=True, 
      editable=False,
      blank=True
      )

  def save(self, *args, **kwargs):
      if not self.ticket_id:
          self.ticket_id = generate_ticket_id()
      super().save(*args, **kwargs)
        
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
