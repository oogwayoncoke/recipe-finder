from contextvars import ContextVar

# Create a context variable with a default value of None
_current_tenant_id = ContextVar('current_tenant_id', default=None)

def set_current_tenant_id(tenant_id):
    """Sets the current tenant ID for the current async context / thread."""
    _current_tenant_id.set(tenant_id)

def get_current_tenant_id():
    """Retrieves the current tenant ID."""
    return _current_tenant_id.get()