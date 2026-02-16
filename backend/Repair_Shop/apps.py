from django.apps import AppConfig

class RepairShopConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'Repair_Shop'

    def ready(self):
        import Repair_Shop.signals