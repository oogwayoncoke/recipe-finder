from django.contrib.auth.models import User
from django.db import models


class UserProfile(models.Model):
  TECH_LEVEL_CHOICES = [
        ('OSTA', 'Master Technician'),
        ('SABI', 'Apprentice'),
        ('NONE', 'Not a Technician'),
    ]
  
  user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
  tenant = models.ForeignKey('shops.Tenant', on_delete=models.SET_NULL, null=True)
  role = models.CharField(max_length=20, choices=[('OWNER','Owner'),('TECH','Technician')], 
                          default='OWNER')
  tech_level = models.CharField(max_length=10, choices=TECH_LEVEL_CHOICES, default='NONE')

  def __str__(self):
    return f"{self.user.username} - {self.role}"
