from django.db import models
from datetime import timedelta
import datetime
from django.utils import timezone
import uuid

def get_default_expiry():
    return timezone.now() + datetime.timedelta(days=7)

class ActionToken(models.Model):
    TOKEN_TYPES = (
        ('STAFF_INVITE', 'Staff Invite'),
        ('CUSTOMER_INVITE', 'Customer Invite'), 
    )
    
    ROLE_CHOICES = (
        ('OWNER', 'Owner'),
        ('TECH', 'Technician'), 
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
    tech_level = models.CharField(choices=TECH_LEVEL_CHOICES, max_length=10, default='NONE',null=True,blank=True)
    related_ticket = models.ForeignKey('WorkOrder', null=True, blank=True,
                                       on_delete=models.SET_NULL)
    is_used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(default=get_default_expiry)
    metadata = models.JSONField(default=dict, blank=True)
    
    def is_expired(self):
        expiry_limit = self.created_at + timedelta(hours=48)
        return timezone.now() > expiry_limit