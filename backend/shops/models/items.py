from django.db import models


from django.db import models

# --- SUPER-TYPE MODEL ---
class Item(models.Model):
    DEVICE_TYPES = [
        ('COMP', 'Computing'),
        ('MOBL', 'Mobile'),
        ('GAME', 'Gaming'),
        ('AUDI', 'Audio'),
        ('WEAR', 'Wearable'),
        ('VIDO', 'Home Video'),
    ]
    device_type = models.CharField(max_length=4, choices=DEVICE_TYPES)
    brand = models.CharField(max_length=100)
    model_name = models.CharField(max_length=100)
    serial_number = models.CharField(max_length=100, unique=True)
    customer = models.ForeignKey('Customer', on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.brand} {self.model_name} ({self.get_device_type_display()})"


class WearableItem(Item):
    water_resistance_rating = models.CharField(max_length=50, blank=True)
    battery_cycle_count = models.PositiveIntegerField(default=0)
    firmware_version = models.CharField(max_length=50, blank=True)
    sensor_data = models.JSONField(default=dict, help_text="Store health for Heart Rate, GPS, etc.")


class HomeVideoItem(Item):
    PANEL_CHOICES = [('OLED', 'OLED'), ('QLED', 'QLED'), ('LED', 'LED'), ('PROJ', 'Projector')]
    panel_type = models.CharField(max_length=4, choices=PANEL_CHOICES)
    resolution_max = models.CharField(max_length=20, default="4K")
    backlit_hours = models.PositiveIntegerField(default=0)
    is_smart = models.BooleanField(default=True)

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
