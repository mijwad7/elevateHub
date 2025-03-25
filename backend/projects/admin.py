from django.contrib import admin
from .models import HelpComment, HelpRequest
# Register your models here.
admin.site.register(HelpComment)
admin.site.register(HelpRequest)
