from django.contrib import admin
from .models import CustomUser, Discussion, DiscussionPost, Category

# Register your models here.
admin.site.register(CustomUser)
admin.site.register(Discussion)
admin.site.register(DiscussionPost)
admin.site.register(Category)
