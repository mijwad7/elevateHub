from django.db import models
from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver
from credits.models import CreditTransaction
from api.models import Category
import logging

logger = logging.getLogger(__name__)

class Resource(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField()
    category = models.ForeignKey(Category, on_delete=models.CASCADE)
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)  # Index for sorting
    upvotes = models.IntegerField(default=0)
    download_count = models.IntegerField(default=0)

    class Meta:
        indexes = [
            models.Index(fields=['uploaded_by', 'created_at']),  # For user-specific resources
            models.Index(fields=['category', 'created_at']),     # For category-specific resources
        ]

    def __str__(self):
        return self.title

class ResourceFile(models.Model):
    resource = models.ForeignKey(Resource, on_delete=models.CASCADE, related_name="files")
    file = models.FileField(upload_to="resources/")
    file_type = models.CharField(max_length=50, blank=True)  # Optional: store file type (e.g., image, video, pdf)

    def __str__(self):
        return f"File for {self.resource.title}"

class ResourceVote(models.Model):
    resource = models.ForeignKey(Resource, on_delete=models.CASCADE, related_name='votes')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["user", "resource"], name="unique_resource_upvote"),
        ]

    def __str__(self):
        return f"{self.user.username} voted on {self.resource.title}"

class ResourceDownload(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    resource = models.ForeignKey(Resource, on_delete=models.CASCADE, related_name="downloads")
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["user", "resource"], name="unique_download"),
        ]

@receiver(post_save, sender=ResourceDownload)
def award_credits_on_download(sender, instance, created, **kwargs):
    if created:
        resource = instance.resource
        user = resource.uploaded_by
        logger.info(f"Processing download of resource {resource.title} by user {instance.user.username}")

        has_earned_credits = CreditTransaction.objects.filter(
            user=user,
            description=f"Earned 5 credits for first download of {resource.title}",
        ).exists()

        if not has_earned_credits:
            logger.info(f"Awarding 5 credits to {user.username} for first download of {resource.title}")
            resource.download_count += 1
            resource.save()
            user.get_credits().add_credits(5, f"Earned 5 credits for first download of {resource.title}")
        else:
            resource.download_count += 1
            resource.save()

@receiver(post_save, sender=ResourceVote)
def award_credits_on_upvote(sender, instance, created, **kwargs):
    if created:  # Only on new upvotes
        resource = instance.resource
        user = resource.uploaded_by
        logger.info(f"Processing upvote on resource {resource.title} by user {instance.user.username}")

        has_earned_credits = CreditTransaction.objects.filter(
            user=user,
            description=f"Earned 1 credit for first upvote on {resource.title}"
        ).exists()

        if not has_earned_credits:
            logger.info(f"Awarding 1 credit to {user.username} for first upvote on {resource.title}")
            resource.upvotes += 1
            resource.save()
            user.get_credits().add_credits(1, f"Earned 1 credit for first upvote on {resource.title}")
        else:
            resource.upvotes += 1
            resource.save()