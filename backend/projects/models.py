from django.db import models
from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver
from api.models import Category
from django.utils import timezone
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import logging

logger = logging.getLogger(__name__)


class HelpRequest(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField()
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name="help_requests")
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="help_requests")
    created_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=[('open', 'Open'), ('resolved', 'Resolved')], default='open')
    credit_offer_chat = models.IntegerField(default=0, help_text="Credits offered for chat help")
    credit_offer_video = models.IntegerField(default=0, help_text="Credits offered for video help")

    def __str__(self):
        return self.title

class HelpComment(models.Model):
    help_request = models.ForeignKey(HelpRequest, on_delete=models.CASCADE, related_name="comments")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="help_comments")
    content = models.TextField()
    upvotes = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Comment by {self.user.username} on {self.help_request.title}"

class HelpCommentUpvote(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    comment = models.ForeignKey(HelpComment, on_delete=models.CASCADE, related_name="comment_upvotes")

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['user', 'comment'], name='unique_help_comment_upvote'),
        ]

@receiver(post_save, sender=HelpCommentUpvote)
def award_credit_on_comment_upvote(sender, instance, created, **kwargs):
    if created:
        comment = instance.comment
        user = comment.user
        comment.upvotes += 1
        comment.save(update_fields=['upvotes'])
        credits = user.get_credits()  # Assuming Credit model has this method
        credits.add_credits(1, description=f"Earned 1 credit for upvote on comment {comment.id}")


class ChatSession(models.Model):
    help_request = models.ForeignKey('HelpRequest', on_delete=models.CASCADE, related_name="chat_sessions")
    requester = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="chat_requests")
    helper = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="chat_helps")
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"Chat for {self.help_request.title} between {self.requester.username} and {self.helper.username}"

class ChatMessage(models.Model):
    chat_session = models.ForeignKey(ChatSession, on_delete=models.CASCADE, related_name="messages")
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    content = models.TextField()
    image = models.ImageField(upload_to='chat_images/', blank=True, null=True)  # New field
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.sender.username}: {self.content[:50]}"



class VideoCall(models.Model):
    help_request = models.ForeignKey('HelpRequest', on_delete=models.CASCADE, related_name="video_calls")
    requester = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="video_requests")
    helper = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="video_helps")
    started_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    def end_call(self):
        self.is_active = False
        self.ended_at = timezone.now()
        self.save(update_fields=['is_active', 'ended_at'])

    def __str__(self):
        return f"Video call for {self.help_request.title} between {self.requester.username} and {self.helper.username}"





class Notification(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    notification_type = models.CharField(max_length=50, default='info')  # info, success, warning, error
    link = models.URLField(blank=True, null=True)  # Optional link for the notification

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.message[:50]}"

@receiver(post_save, sender=Notification)
def send_notification(sender, instance, created, **kwargs):
    if created:
        logger.info(f"Notification created: {instance.id} - {instance.message}")
        channel_layer = get_channel_layer()
        notification_data = {
            'id': instance.id,
            'message': instance.message,
            'is_read': instance.is_read,
            'created_at': instance.created_at.isoformat(),
            'notification_type': instance.notification_type,
            'link': instance.link
        }

        # Add callId for video_call_started
        if instance.notification_type == 'video_call_started':
            try:
                video_call = VideoCall.objects.filter(
                    requester=instance.user,
                    is_active=True
                ).latest('started_at')
                notification_data['callId'] = video_call.id
                logger.info(f"Added callId {video_call.id} to notification {instance.id}")
            except VideoCall.DoesNotExist:
                logger.warning(f"No active VideoCall found for notification {instance.id}")
                notification_data['callId'] = None

        logger.info(f"Sending notification to user {instance.user.id}: {notification_data}")
        
        # Send to user-specific group
        async_to_sync(channel_layer.group_send)(
            f'notifications_{instance.user.id}',
            {
                'type': 'notification',
                'notification': notification_data
            }
        )
        
        logger.info(f"Notification {instance.id} sent through WebSocket")