from django.contrib import admin
from .models import Credit, CreditTransaction

# Register your models here.
admin.site.register(Credit)
admin.site.register(CreditTransaction)
