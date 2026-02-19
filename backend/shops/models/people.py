from django.db import models
from .base import TenantModel
from phonenumber_field.modelfields import PhoneNumberField

class Customer(TenantModel):
  full_name = models.CharField(max_length=255, null=False)
  address_street = models.CharField(max_length=255, blank=True)
  address_city = models.CharField(max_length=255, blank=True)
  address_zip = models.CharField(max_length=255, blank=True)
 
  def __str__(self):
    return self.full_name

class CustomerPhone(TenantModel):
  customer = models.ForeignKey(Customer, related_name='phones', on_delete=models.CASCADE)
  phone_number = PhoneNumberField(region='EG',null=False)
  
  
class Technician(TenantModel):
    full_name = models.CharField(max_length=255, null=False)
    role = models.CharField(max_length=50, null=False)
    hourly_rate = models.DecimalField(max_digits=10, decimal_places=2,
                                      default=0.00,
                                    null=False)
    mentor = models.ForeignKey(
        'self', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='apprentices'
    )
    
    def __str__(self):
      return f'{self.full_name}({self.role} - ${self.hourly_rate}/hr)'

class TechnicianPhone(TenantModel):
  technician = models.ForeignKey(Technician, related_name='phones', on_delete=models.CASCADE)
  phone_number = PhoneNumberField(region='EG',null=False)
  