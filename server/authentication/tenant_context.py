import contextvars

_curent_tenant_id = contextvars.ContextVar('current_tenant_id', default=None)

def set_current_tenant_id(tennant_id):
  _curent_tenant_id.set(tennant_id)

def get_current_tenant_id():
  return _curent_tenant_id.get()