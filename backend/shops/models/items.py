from django.db import models


class Item(models.Model):
  
  DEVICE_TYPES = [
        ('COMP', 'Computing'),
        ('MOBL', 'Mobile'),
        ('GAME', 'Gaming'),
        ('AUDI', 'Audio'),
        ('WEAR', 'Wearable'),
        ('VIDO', 'Home Video'),
    ]
  
  tenant = models.ForeignKey('shops.Tenant', on_delete=models.CASCADE, null=False, 
                             related_name='items')
  customer = models.ForeignKey('shops.Customer', on_delete=models.CASCADE, null=False, 
                               related_name='devices')
  brand = models.CharField(max_length=255, null=True,blank=True)
  model_name = models.CharField(max_length=255, null=True,blank=True)
  serial_number = models.CharField(max_length=255, null=True, blank=True)
  device_type = models.CharField(max_length=4, choices=DEVICE_TYPES)
  specifications = models.JSONField(default=dict, blank=True)
  
  def __str__(self):
    return f'{self.device_type} - {self.customer.full_name}'

class ElectronicItem(Item):
  password_hint = models.CharField(max_length=255, blank=True)
  os_version = models.CharField(max_length=255, blank=True)

class MechanicalItem(Item):
  fuel_type = models.CharField(max_length=255, blank=True)
  engine_displacement = models.CharField(max_length=255, blank=True)
