from django.utils.deprecation import MiddlewareMixin
from .models import UserProfile
from .tenant_context import set_current_tenant_id


class TenantMiddleware(MiddlewareMixin):
  def process_request(self, request):
    request.tenant = None
    set_current_tenant_id = None
        
    if request.user.is_authenticated:
      try:
        profile = UserProfile.objects.select_related('tenant').get(user=request.user)
        request.tenant = profile.tenant
        set_current_tenant_id(profile.tenant.id)
      except UserProfile.DoesNotExist:
        request.tenant = None
    
    return None