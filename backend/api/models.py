from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
    email = models.EmailField(unique=True)
    profile_image = models.ImageField(upload_to="profile_images/", blank=True, null=True)

    def get_credits(self):
        from credits.models import Credit
        credit, created = Credit.objects.get_or_create(user=self)
        return credit