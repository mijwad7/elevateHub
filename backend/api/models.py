from django.contrib.auth.models import AbstractUser
from django.db import models
import pyotp
import time
from django.utils import timezone

class CustomUser(AbstractUser):
    email = models.EmailField(unique=True)
    profile_image = models.ImageField(upload_to="profile_images/", blank=True, null=True)
    otp_secret = models.CharField(max_length=32, blank=True, null=True)
    otp_verified = models.BooleanField(default=False)
    otp_created_at = models.DateTimeField(null=True, blank=True)

    def get_credits(self):
        from credits.models import Credit
        credit, created = Credit.objects.get_or_create(user=self)
        return credit

    def generate_otp(self):
        """Generate a new OTP secret and return the OTP code"""
        self.otp_secret = pyotp.random_base32()
        self.otp_created_at = timezone.now()
        self.save()
        totp = pyotp.TOTP(self.otp_secret)
        return totp.now()

    def verify_otp(self, otp_code):
        """Verify the provided OTP code"""
        if not self.otp_secret or not self.otp_created_at:
            return False
        
        # Check if OTP is expired (5 minutes)
        if (timezone.now() - self.otp_created_at).total_seconds() > 300:
            return False
            
        totp = pyotp.TOTP(self.otp_secret)
        is_valid = totp.verify(otp_code)
        if is_valid:
            self.otp_verified = True
            self.save()
        return is_valid

class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)

    class Meta:
        verbose_name = "Category"
        verbose_name_plural = "Categories"

    def __str__(self):
        return self.name