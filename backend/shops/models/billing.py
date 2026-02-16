from django.db import models


class Invoice(models.Model):
  tenant = models.ForeignKey('shops.Tenant', on_delete=models.CASCADE,null=False)
  work_order = models.OneToOneField('shops.WorkOrder',
                                    on_delete=models.CASCADE,
                                    related_name='invoice')
  
  calculated_total = models.DecimalField(max_digits=12, decimal_places=2, null=False)
  
  is_paid = models.BooleanField(default=False, null=False)
  
  pdf_copy = models.FileField(null=True,blank=True)
  
  issued_date = models.DateField(auto_now_add=True)
  
  @property
  def total_amount(self):
    parts = sum(p.quantity_used * (p.price_at_use or 0) for p in self.work_order.parts_used.all())
    services = sum(s.cost for s in self.work_order.services.all())
    return parts + services

  def __str__(self):
    return f"Invoice for Order {self.work_order.id}"



class Payment(models.Model):
    invoice = models.ForeignKey('shops.Invoice', on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(max_length=50) # Fix your EERD typo "Meathod" here!
    timestamp = models.DateTimeField(auto_now_add=True)