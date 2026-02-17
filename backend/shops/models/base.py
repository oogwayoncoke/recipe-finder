from django.db import models
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
        db_index=True, 
        on_delete=models.CASCADE
    )

    class Meta:
        abstract = True
