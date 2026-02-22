import uuid
from datetime import timedelta

from authentication.tenant_context import get_current_tenant_id
from django.db import models
from django.utils import timezone


class Tenant(models.Model):
  tenant_id = models.UUIDField(primary_key=True, default=uuid.uuid4,
                               editable=False, 
                               null=False)
  shop_name=models.CharField(max_length=255, null=False)
  first_name = models.CharField(max_length=255,null=True)
  last_name = models.CharField(max_length=255,null=True)
  owner_email=models.EmailField(unique=True, null=False)
  preferences = models.JSONField(default=dict, blank=True)
  created_at = models.DateTimeField(auto_now_add=True)
  
  
  
  def __str__(self):
    return self.shop_name


class TenantManager(models.Manager):
   def get_queryset(self):
        tenant_id = get_current_tenant_id()
        queryset = super().get_queryset()
       
        if tenant_id:
            return queryset.filter(tenant_id=tenant_id)
        return queryset

class TenantModel(models.Model):
    tenant = models.ForeignKey(
        'shops.Tenant', 
        db_index=True, 
        on_delete=models.CASCADE
    )

    objects = models.Manager()
    tenant_objects = TenantManager()
    class Meta:
        abstract = True
