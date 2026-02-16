from django.db import models
from django.contrib.auth.models import User

class UserProfile(models.Model):
  user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
  tenant = models.ForeignKey('shops.Tenant', on_delete=models.SET_NULL, null=True)
  role = models.CharField(max_length=20, choices=[('OWNER','Owner'),('TECH','Technician')], 
                          default='OWNER')

  def __str__(self):
    return f"{self.user.username} - {self.role}"