from django.db import models
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError


class ProjectIssue(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="issues")
    title = models.CharField(max_length=255)
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_resolved = models.BooleanField(default=False)

    def __str__(self):
        return self.title


class IssueComment(models.Model):
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="issue_comments"
    )
    issue = models.ForeignKey(
        ProjectIssue, on_delete=models.CASCADE, related_name="comments"
    )
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Comment by {self.user.username} on {self.issue.title}"


class PairingRequest(models.Model):
    STATUS_CHOICES = (
        ("pending", "Pending"),
        ("accepted", "Accepted"),
        ("completed", "Completed"),
        ("rejected", "Rejected"),
    )
    issue = models.ForeignKey(
        ProjectIssue, on_delete=models.CASCADE, related_name="pairing_requests"
    )
    helper = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="pairing_offers"
    )
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="pending")
    requested_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ("issue", "helper")  # One pairing request per user per issue

    def clean(self):
        if self.issue.user == self.helper:
            raise ValidationError("You cannot pair with your own issue.")

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.helper.username} offers to help {self.issue.title}"


# Assuming existing Profile model for credits
class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    credits = models.IntegerField(default=100)

    def __str__(self):
        return f"{self.user.username}'s profile"
