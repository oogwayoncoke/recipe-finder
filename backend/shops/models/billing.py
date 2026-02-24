from django.db import models

from .base import TenantModel


class Invoice(TenantModel):
    tenant = models.ForeignKey("shops.Tenant", on_delete=models.CASCADE, null=False)
    work_order = models.OneToOneField(
        "shops.WorkOrder", on_delete=models.CASCADE, related_name="invoice"
    )
    subtotal = models.DecimalField(
        max_digits=12, decimal_places=2, null=False, default=0.00
    )
    tax = models.DecimalField(max_digits=12, decimal_places=2, null=False, default=0.00)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    calculated_total = models.DecimalField(
        max_digits=12, decimal_places=2, null=False, default=0.00
    )
    is_paid = models.BooleanField(default=False, null=False)
    pdf_copy = models.FileField(null=True, blank=True)
    issued_date = models.DateField(auto_now_add=True)

    def __str__(self):
        return f"Invoice {self.id} - {self.total_amount} EGP"


class Payment(models.Model):
    invoice = models.ForeignKey('shops.Invoice', on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(max_length=50) # Fix your EERD typo "Meathod" here!
    timestamp = models.DateTimeField(auto_now_add=True)
