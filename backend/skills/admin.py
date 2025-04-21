from django.contrib import admin
from .models import SkillProfile, Mentorship

@admin.register(SkillProfile)
class SkillProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'skill', 'proficiency', 'is_mentor', 'created_at')
    list_filter = ('proficiency', 'is_mentor')
    search_fields = ('user__username', 'skill')

@admin.register(Mentorship)
class MentorshipAdmin(admin.ModelAdmin):
    list_display = ('learner', 'mentor', 'skill', 'status', 'created_at')
    list_filter = ('status',)
    search_fields = ('learner__username', 'mentor__username', 'skill__skill')