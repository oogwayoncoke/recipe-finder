from django.db import models
from django.utils import timezone
from datetime import timedelta
from authentication.tenant_context import get_current_tenant_id
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


class TenantManager(models.Manager):
   def get_queryset(self):
        tenant_id = get_current_tenant_id()
        queryset = super().get_querysrt()
       
        if tenant_id:
            return queryset.filter(tenant_id=tenant_id)
        return queryset

class TenantModel(models.Model):
    tenant = models.ForeignKey(
        'shops.Tenant', 
        db_index=True, 
        on_delete=models.CASCADE
    )

    class Meta:
        abstract = True
class Invitation(models.Model):
    ROLE_CHOICES = [
        ('ADMIN', 'Admin'),
        ('TECHNICIAN', 'Technician'),
        ('CUSTOMER', 'Customer'), 
    ]
    
    token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    tenant = models.ForeignKey('Tenant', on_delete=models.CASCADE, related_name='invitations')
    email = models.EmailField()
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='TECHNICIAN')
    is_used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    tech_level = models.CharField(
        max_length=10, 
        choices=[('OSTA', 'Master Technician'), ('SABI', 'Apprentice'), ('NONE', 'N/A')],
        default='NONE'
    )
    def is_valid(self):
        return not self.is_used and timezone.now() < self.created_at + timedelta(hours=24)
    
    def __str__(self):
        return f"{self.role} Invite for {self.email} ({self.tenant.name})"