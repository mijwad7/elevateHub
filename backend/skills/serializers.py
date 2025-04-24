from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import SkillProfile, Mentorship
from api.models import Category # Import Category

User = get_user_model()

class SimpleCategorySerializer(serializers.ModelSerializer):
    """Serializer for basic category info."""
    class Meta:
        model = Category
        fields = ('id', 'name')

class SkillProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    category_details = SimpleCategorySerializer(source='category', read_only=True) # Nested serializer for read operations
    category = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), 
        write_only=True
    ) 

    class Meta:
        model = SkillProfile
        fields = ['id', 'user', 'username', 'skill', 'category', 'category_details', 'proficiency', 'is_mentor', 'created_at']
        read_only_fields = ['user', 'username', 'created_at', 'category_details']

class SimpleUserSerializer(serializers.ModelSerializer):
    """Serializer for basic user info."""
    class Meta:
        model = User
        fields = ('id', 'username', 'profile_image')

class SimpleSkillProfileSerializer(serializers.ModelSerializer):
    """Serializer for basic skill profile info."""
    class Meta:
        model = SkillProfile
        fields = ('id', 'skill')

class MentorshipSerializer(serializers.ModelSerializer):
    """Serializer for the Mentorship model, including mentor and mentee details."""
    mentor = SimpleUserSerializer(read_only=True)
    mentee = SimpleUserSerializer(source='learner', read_only=True) # Map learner to mentee
    skill_profile = SimpleSkillProfileSerializer(source='skill', read_only=True) # Include skill details
    topic = serializers.CharField(source='skill.skill', read_only=True) # Direct access to skill name as topic

    class Meta:
        model = Mentorship
        fields = ('id', 'mentor', 'mentee', 'skill_profile', 'topic', 'status', 'created_at', 'chat_session_id')
        read_only_fields = ('created_at', 'chat_session_id', 'mentor', 'mentee', 'skill_profile', 'topic') # Status might be updatable later