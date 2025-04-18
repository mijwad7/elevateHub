from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
import pyotp
import time
import logging

logger = logging.getLogger(__name__)

class CustomUser(AbstractUser):
    email = models.EmailField(unique=True)
    profile_image = models.ImageField(upload_to="profile_images/", blank=True, null=True)
    otp_secret = models.CharField(max_length=32, blank=True, null=True)
    otp_verified = models.BooleanField(default=False)
    otp_created_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=False)  # Override the default to False

    def get_credits(self):
        from credits.models import Credit
        credit, created = Credit.objects.get_or_create(user=self)
        return credit

    def generate_otp(self):
        """Generate a new OTP secret and return the OTP code"""
        self.otp_secret = pyotp.random_base32()
        self.otp_created_at = timezone.now()
        self.save()
        totp = pyotp.TOTP(self.otp_secret, interval=300)  # 5 minutes interval
        logger.info(f"OTP generated for user {self.username}")  # Log OTP generation
        return totp.now()

    def verify_otp(self, otp_code):
        """Verify the provided OTP code"""
        if not self.otp_secret or not self.otp_created_at:
            logger.warning(f"OTP verification failed for user {self.username}: No OTP secret or created_at")  # Log warning
            return False
        
        # Check if OTP is expired (5 minutes)
        if (timezone.now() - self.otp_created_at).total_seconds() > 300:
            logger.warning(f"OTP expired for user {self.username}")  # Log warning
            return False
            
        totp = pyotp.TOTP(self.otp_secret, interval=300)  # 5 minutes interval
        is_valid = totp.verify(otp_code, valid_window=1)  # Allow 1 window before/after
        if is_valid:
            self.otp_verified = True
            self.is_active = True  # Activate the user
            self.save()
            logger.info(f"OTP verified for user {self.username}")  # Log successful verification
        return is_valid

class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)

    class Meta:
        verbose_name = "Category"
        verbose_name_plural = "Categories"

    def __str__(self):
        return self.name