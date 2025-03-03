from django.contrib.auth.models import AbstractUser
from django.db import models
from django.conf import settings

class CustomUser(AbstractUser):
    profile_image = models.ImageField(upload_to="profile_images/", blank=True, null=True)

class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)

    class Meta:
        verbose_name = "Category"
        verbose_name_plural = "Categories"

    def __str__(self):
        return self.name

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


