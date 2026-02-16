from django.db import models


class Item(models.Model):
  tenant = models.ForeignKey('shops.Tenant', on_delete=models.CASCADE, null=False, 
                             related_name='items')
  
  customer = models.ForeignKey('shops.Customer', on_delete=models.CASCADE, null=False, 
                               related_name='devices')
  
  device_image = models.ImageField(upload_to='device_labels/', null=True, blank=True)
  serial_number = models.CharField(max_length=100, null=True, blank=True)
  raw_ocr_data = models.JSONField(default=dict, blank=True)
  device_type = models.CharField(max_length=100, null=False)
  specifications = models.JSONField(default=dict, blank=True)
  
  def __str__(self):
    return f'{self.device_type} - {self.customer.full_name}'


class AutomotiveItem(Item):
  vin = models.CharField(max_length=17, unique=True, blank=True)
  engine_type = models.CharField(max_length=100, blank=True)

class ComputingItem(Item):
  processor = models.CharField(max_length=100, blank=True)
  ram = models.CharField(max_length=50, blank=True)
  gpu = models.CharField(max_length=100, blank=True)
  storage = models.CharField(max_length=50, blank=True)

class MobileItem(Item):
  IMEI = models.CharField(max_length=100, blank=True)
  battery_health = models.IntegerField(null=True,blank=True)
  screen_type = models.CharField(max_length=100, blank=True)
  
class GamingItem(Item):
  storage_capacity = models.CharField(max_length=50, blank=True)
  controller_type = models.CharField(max_length=50, blank=True)
  firmware = models.CharField(max_length=50, blank=True)
  
  
class AudioItem(Item):
  firmware_version = models.CharField(max_length=50, blank=True)
  case_serial = models.CharField(max_length=50, blank=True) 
