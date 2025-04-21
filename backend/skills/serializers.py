from rest_framework import serializers
from .models import SkillProfile, Mentorship
from api.models import CustomUser

class SkillProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = SkillProfile
        fields = ['id', 'user', 'username', 'skill', 'proficiency', 'is_mentor', 'created_at']
        read_only_fields = ['user', 'username', 'created_at']

class MentorshipSerializer(serializers.ModelSerializer):
    learner_username = serializers.CharField(source='learner.username', read_only=True)
    mentor_username = serializers.CharField(source='mentor.username', read_only=True)
    skill_name = serializers.CharField(source='skill.skill', read_only=True)

    class Meta:
        model = Mentorship
        fields = [
            'id', 'learner', 'learner_username', 'mentor', 'mentor_username',
            'skill', 'skill_name', 'status', 'feedback', 'rating', 'created_at',
            'auto_complete_date', 'chat_session_id'
        ]
        read_only_fields = ['learner_username', 'mentor_username', 'skill_name', 'created_at', 'chat_session_id']