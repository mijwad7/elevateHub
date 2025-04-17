from django.db import models
from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver
from credits.models import CreditTransaction
from api.models import Category
import logging

logger = logging.getLogger(__name__)

class Discussion(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField(default="description")
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name="discussions")
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="discussions")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

class DiscussionPost(models.Model):
    discussion = models.ForeignKey(Discussion, on_delete=models.CASCADE, related_name="posts")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="discussion_posts")
    content = models.TextField()
    upvotes = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Post by {self.user.username} in {self.discussion.title}"

class DiscussionPostUpvote(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    post = models.ForeignKey("DiscussionPost", on_delete=models.CASCADE, related_name="post_upvotes")

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['user', 'post'], name='unique_upvote'),
        ]

@receiver(post_save, sender=DiscussionPostUpvote)
def award_credit_on_upvote(sender, instance, created, **kwargs):
    if created:  # Only on new upvotes
        post = instance.post
        user = post.user
        logger.info(f"Processing upvote on discussion post {post.id} by user {instance.user.username}")
        
        post.upvotes += 1
        post.save(update_fields=['upvotes'])

        has_earned_credits = CreditTransaction.objects.filter(
            user=user,
            amount=1,
            description__contains=f"upvote on post {post.id}"
        ).exists()

        if not has_earned_credits and post.upvotes == 1:
            logger.info(f"Awarding 1 credit to {user.username} for first upvote on post {post.id}")
            credits = user.get_credits()
            credits.add_credits(1, description=f"Earned 1 credit for first upvote on post {post.id}")