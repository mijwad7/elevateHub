from django.contrib import admin
from .models import HelpComment, HelpRequest, ChatSession, ChatMessage
# Register your models here.
admin.site.register(HelpComment)
admin.site.register(HelpRequest)
admin.site.register(ChatSession)
admin.site.register(ChatMessage)
