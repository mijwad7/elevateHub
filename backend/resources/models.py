from django.db import models
from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver
from credits.models import CreditTransaction
from api.models import Category

class Resource(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField()
    file = models.FileField(upload_to="resources/")
    category = models.ForeignKey(Category, on_delete=models.CASCADE)
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    upvotes = models.IntegerField(default=0)  # Only upvotes now
    download_count = models.IntegerField(default=0)

    def __str__(self):
        return self.title


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
    resource = models.ForeignKey(
        Resource, on_delete=models.CASCADE, related_name="downloads"
    )
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

        # Check if this user has already earned credits for this download
        has_earned_credits = CreditTransaction.objects.filter(
            user=user,
            description=f"Earned 5 credits for first download of {resource.title}",
        ).exists()

        if not has_earned_credits:
            resource.download_count += 1
            resource.save()
            user.get_credits().add_credits(5)  # +5 for first download
            CreditTransaction.objects.create(
                user=user,
                amount=5,
                description=f"Earned 5 credits for first download of {resource.title}",
            )
        else:
            resource.download_count += 1  # Still increment count, but no credits
            resource.save()

@receiver(post_save, sender=ResourceVote)
def award_credits_on_upvote(sender, instance, created, **kwargs):
    if created:  # Only on new upvotes
        resource = instance.resource
        user = resource.uploaded_by

        # Check if this user has already earned credits for this upvote
        has_earned_credits = CreditTransaction.objects.filter(
            user=user,
            description=f"Earned 1 credit for first upvote on {resource.title}"
        ).exists()

        if not has_earned_credits:
            resource.upvotes += 1
            resource.save()
            user.get_credits().add_credits(1)  # +1 for first upvote
            CreditTransaction.objects.create(
                user=user,
                amount=1,
                description=f"Earned 1 credit for first upvote on {resource.title}"
            )
        else:
            resource.upvotes += 1  # Still increment upvotes, but no credits
            resource.save()
