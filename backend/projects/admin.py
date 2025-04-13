from django.contrib import admin
from .models import HelpComment, HelpRequest, ChatSession, ChatMessage, VideoCall, Notification

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('user', 'message', 'is_read', 'created_at', 'notification_type')
    list_filter = ('is_read', 'notification_type', 'created_at')
    search_fields = ('user__username', 'message')
    readonly_fields = ('created_at',)
    ordering = ('-created_at',)

# Register your models here.
admin.site.register(HelpComment)
admin.site.register(HelpRequest)
admin.site.register(ChatSession)
admin.site.register(ChatMessage)
admin.site.register(VideoCall)
