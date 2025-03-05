from django.contrib import admin
from .models import Discussion, DiscussionPost, Category

# Register your models here.
admin.site.register(Discussion)
admin.site.register(DiscussionPost)
admin.site.register(Category)