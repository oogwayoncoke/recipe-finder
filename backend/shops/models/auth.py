from django.db import models
import datetime
from django.utils import timezone
import uuid

def get_default_expiry():
    return timezone.now() + datetime.timedelta(days=7)

class ActionToken(models.Model):
    TOKEN_TYPES = (
        ('EMP_INVITE', 'Employee Invite'),
        ('CUST_ONBOARD', 'Customer Onboarding'),
    )
    
    ROLE_CHOICES = (
        ('ADMIN', 'Admin'),
        ('TECHNICIAN', 'Technician'),
        ('CUSTOMER', 'Customer'),
        )
    
    TECH_LEVEL_CHOICES = (
        ('OSTA', 'Master Technician (Osta)'),
        ('SABI', 'Apprentice (Sabi)'),
        ('NONE', 'N/A'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    phone_number = models.CharField(max_length=15)
    tenant = models.ForeignKey('Tenant', on_delete=models.CASCADE)
    token_type = models.CharField(choices=TOKEN_TYPES, max_length=20)
    role = models.CharField(choices=ROLE_CHOICES, max_length=20, default='TECHNICIAN')
    tech_level = models.CharField(choices=TECH_LEVEL_CHOICES, max_length=10, default='NONE')
    related_ticket = models.ForeignKey('WorkOrder', null=True, blank=True,
                                       on_delete=models.SET_NULL)
    is_used = models.BooleanField(default=False)
    expires_at = models.DateTimeField(default=get_default_expiry)
    metadata = models.JSONField(default=dict, blank=True)
