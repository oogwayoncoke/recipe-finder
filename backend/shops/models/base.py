from django.db import models
from phonenumber_field.modelfields import PhoneNumberField
import uuid 

class Tenant(models.Model):
  tenant_id = models.UUIDField(primary_key=True, default=uuid.uuid4,
                               editable=False, 
                               null=False)
  shop_name=models.CharField(max_length=255, null=False)
  owner_email=models.EmailField(unique=True, null=False)
  preferences = models.JSONField(default=dict, blank=True)
  created_at = models.DateTimeField(auto_now_add=True)
  
  
  
  def __str__(self):
    return self.shop_name
class TenantModel(models.Model):
    tenant = models.ForeignKey(
        Tenant, 
        on_commit=models.CASCADE, 
        db_index=True 
    )

    class Meta:
        abstract = True
class Customer(TenantModel):
  tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, 
                             related_name='customers')
  full_name = models.CharField(max_length=255, null=False)
  phone_number = PhoneNumberField(region='EG',null=False)
 
  def __str__(self):
    return self.full_name
  
class Technician(TenantModel):
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE,
                               null=False)
    full_name = models.CharField(max_length=255, null=False)
    role = models.CharField(max_length=50, null=False)
    hourly_rate = models.DecimalField(max_digits=10, decimal_places=2,
                                      default=0.00,
                                    null=False)
    def __str__(self):
      return f'{self.full_name}({self.role} - ${self.hourly_rate}/hr)'
