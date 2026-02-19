from django.db import models
import uuid

class PhoneVerification(models.Model):
    phone_number = models.CharField(max_length=15, unique=True)
    token = models.UUIDField(default=uuid.uuid4, editable=False) 
    created_at = models.DateTimeField(auto_now_add=True)
    is_used = models.BooleanField(default=False)


      
