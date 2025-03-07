from django.contrib import admin
from .models import CustomUser, Category

# Register your models here.
admin.site.register(CustomUser)
admin.site.register(Category)

