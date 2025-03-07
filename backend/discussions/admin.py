from django.contrib import admin
from .models import Discussion, DiscussionPost

# Register your models here.
admin.site.register(Discussion)
admin.site.register(DiscussionPost)