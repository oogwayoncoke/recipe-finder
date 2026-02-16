from django.db import models
from django.core.exceptions import ValidationError
from phonenumber_field.modelfields import PhoneNumberField
import uuid 
# Create your models here.
class Tenant(models.Model):
  ELECTRONICS = 'electronics'
  AUTOMOTIVE = 'automotive'
  GENERAL = 'general'
  
  SPECIALTY_CHOICES = [
        (ELECTRONICS, 'Electronics Repair'),
        (AUTOMOTIVE, 'Automotive Repair'),
        (GENERAL, 'general repair'),
    ]
  tenant_id = models.UUIDField(primary_key=True, default=uuid.uuid4,editable=False, null=False)
  shop_name=models.CharField(max_length=255, null=False)
  owner_email=models.EmailField(unique=True, null=False)
  preferences = models.JSONField(default=dict, blank=True)
  specialty = models.CharField(max_length=20, choices=SPECIALTY_CHOICES, default=ELECTRONICS, 
                               null=False)
  created_at = models.DateTimeField(auto_now_add=True)
  
  def __str__(self):
    return self.shop_name
  
class Customer(models.Model):
  tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='customers')
  full_name = models.CharField(max_length=255, null=False)
  phone_number = PhoneNumberField(region='EG',null=False)
 
  def __str__(self):
    return self.full_name

class Item(models.Model):
  tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, null=False, related_name='items')
  customer = models.ForeignKey(Customer, on_delete=models.CASCADE, null=False, 
                               related_name='devices')
  device_image = models.ImageField(upload_to='device_labels/', null=True, blank=True)
  serial_number = models.CharField(max_length=100, null=True, blank=True)
  raw_ocr_data = models.JSONField(default=dict, blank=True)
  device_type = models.CharField(max_length=100, null=False)
  specifications = models.JSONField(default=dict, blank=True)
  
  def __str__(self):
    return f'{self.device_type} - {self.customer.full_name}'
  
class Technician(models.Model):
  tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, null=False)
  full_name = models.CharField(max_length=255, null=False)
  role = models.CharField(max_length=50, null=False)
  hourly_rate = models.DecimalField(max_digits=10, decimal_places=2,default=0.00,
                                    null=False)
  def __str__(self):
    return f'{self.full_name}({self.role} - ${self.hourly_rate}/hr)'
  
class Inventory(models.Model):
  tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE,null=False)
  part_name = models.CharField(max_length=255, null=False)
  stock_level= models.IntegerField(default=0, null=False)
  base_price = models.DecimalField(max_digits=10,decimal_places=2, null=False)
  
  def __str__(self):
    return f'{self.part_name} - {self.stock_level} in stock'
  
class WorkOrder(models.Model):
  STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('diagnosing', 'In Diagnosis'),
        ('parts', 'Waiting for Parts'),
        ('ready', 'Ready for Pickup'),
        ('completed', 'Completed'),
    ]
  tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE,null=False)
  item = models.ForeignKey(Item, on_delete=models.CASCADE, null=False, related_name='work_order')
  description = models.CharField(max_length=255, null=True)
  diagnostic_data = models.JSONField(default=dict, blank=True)
  intake_photo = models.ImageField(upload_to='work_orders/intake/',
                                   null=True,
                                   blank=True)
  assigned_tech = models.ForeignKey(Technician, on_delete=models.SET_NULL, 
                                    null=True, 
                                    blank=True)
  status = models.CharField(max_length=20, choices=STATUS_CHOICES, 
                                   default= 'pending',
                                   null=False)
  created_at = models.DateTimeField(auto_now_add=True)
  
  def __str__(self):
    return f'order#{self.id} - {self.item.device_type} ({self.status})'
  
  def clean(self):
        if self.item.tenant != self.tenant:
            raise ValidationError("The selected item must belong to the same shop (tenant).")

class PartUsage(models.Model):
  work_order = models.ForeignKey(WorkOrder, on_delete=models.CASCADE,null=False)
  inventory_item = models.ForeignKey(Inventory, on_delete=models.CASCADE, null=False, 
                                     related_name='parts_used')
  quantity_used = models.IntegerField(default=1, null= False)
  price_at_use = models.DecimalField(max_digits=10, decimal_places=2, editable=False,
                                     null=True,
                                     blank=True)
  
class Service(models.Model):
   work_order = models.ForeignKey(WorkOrder, on_delete=models.CASCADE,null=False)
   service_name = models.CharField(max_length=255, null=False)
   cost = models.DecimalField(max_digits=10, decimal_places=2, null=False)

class Invoice(models.Model):
  tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE,null=False)
  work_order = models.ForeignKey(WorkOrder, on_delete=models.CASCADE)
  calculated_total = models.DecimalField(max_digits=12, decimal_places=2, null=False)
  is_paid = models.BooleanField(default=False, null=False)
  pdf_copy = models.FileField(null=True,blank=True)
  issued_date = models.DateField(auto_now_add=True)
  
  @property
  def total_amount(self):
    parts = sum(p.quantity_used * p.price_at_use for p in self.work_order.parts_used.all())
    services = sum(s.cost for s in self.work_order.services.all())
    return parts + services

  def __str__(self):
    return f"Invoice for Order {self.work_order.id}"