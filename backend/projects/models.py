from django.db import models
from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver
from credits.models import CreditTransaction
from api.models import Category
from django.utils import timezone


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



# projects/models.py (append to existing file)
from django.db.models.signals import post_save
from django.dispatch import receiver
from credits.models import Credit  # Adjust import based on your structure
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

@receiver(post_save, sender=VideoCall)
def handle_video_call_completion(sender, instance, created, update_fields, **kwargs):
    if not created and update_fields and 'is_active' in update_fields and not instance.is_active:
        # Call has ended
        requester_credits = instance.requester.get_credits()
        helper_credits = instance.helper.get_credits()
        amount = instance.help_request.credit_offer_video
        requester_credits.spend_credits(amount, f"Video call completed for {instance.help_request.title}")
        helper_credits.add_credits(amount, f"Helped via video for {instance.help_request.title}")
        # Notify both users
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            'notifications',
            {
                'type': 'notification',
                'notification': {
                    'amount': -amount,
                    'description': f"Video call for {instance.help_request.title} completed",
                    'timestamp': instance.ended_at.isoformat()
                }
            }
        )
        async_to_sync(channel_layer.group_send)(
            'notifications',
            {
                'type': 'notification',
                'notification': {
                    'amount': amount,
                    'description': f"Earned {amount} credits for video help on {instance.help_request.title}",
                    'timestamp': instance.ended_at.isoformat()
                }
            }
        )