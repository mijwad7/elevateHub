from django.db import models
from api.models import CustomUser
from django.conf import settings
import uuid
from api.models import Category

class SkillProfile(models.Model):
    PROFICIENCY_CHOICES = (
        ('beginner', 'Beginner'),
        ('intermediate', 'Intermediate'),
        ('advanced', 'Advanced'),
    )
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='skill_profiles')
    skill = models.CharField(max_length=100)
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name='skill_profiles')
    proficiency = models.CharField(max_length=20, choices=PROFICIENCY_CHOICES)
    is_mentor = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'skill', 'category')

    def __str__(self):
        return f"{self.user.username} - {self.skill} ({self.proficiency}) - {self.category.name}"

class Mentorship(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('rejected', 'Rejected'),
    )
    learner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='learner_mentorships')
    mentor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='mentor_mentorships')
    skill = models.ForeignKey(SkillProfile, on_delete=models.CASCADE, related_name='mentorships')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', db_index=True)  # Index for filtering
    feedback = models.TextField(blank=True, null=True)
    rating = models.IntegerField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)  # Index for sorting
    auto_complete_date = models.DateTimeField(blank=True, null=True)
    chat_session_id = models.UUIDField(default=uuid.uuid4, editable=False, unique=True, db_index=True)  # Index for lookups

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['learner', 'mentor', 'skill'], name='unique_mentorship')
        ]
        indexes = [
            models.Index(fields=['learner', 'status']),  # For learner-specific mentorships
            models.Index(fields=['mentor', 'status']),   # For mentor-specific mentorships
        ]

    def __str__(self):
        return f"{self.learner.username} mentored by {self.mentor.username} in {self.skill.skill}"