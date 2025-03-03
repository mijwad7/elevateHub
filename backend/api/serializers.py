from django.contrib.auth.models import User
from rest_framework import serializers
from .models import CustomUser, Discussion, DiscussionPost

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id','username', 'email','password', 'profile_image', 'is_staff']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = CustomUser.objects.create_user(**validated_data)
        return user


class DiscussionSerializer(serializers.ModelSerializer):
    created_by_username = serializers.ReadOnlyField(source='created_by.username')
    total_posts = serializers.IntegerField(read_only=True)

    class Meta:
        model = Discussion
        fields = ["id", "title", "created_by", "created_by_username", "created_at", "total_posts"]
        read_only_fields = ["created_by", "created_at"]


class DiscussionPostSerializer(serializers.ModelSerializer):
    user_username = serializers.ReadOnlyField(source='user.username')
    has_upvoted = serializers.SerializerMethodField()

    class Meta:
        model = DiscussionPost
        fields = ['id', 'discussion', 'user', 'user_username', 'content', 'upvotes', 'created_at', 'has_upvoted']
        read_only_fields = ['user', 'discussion', 'created_at']

    def get_has_upvoted(self, obj):
        user = self.context.get('request').user
        if user and user.is_authenticated:
            return obj.post_upvotes.filter(user=user).exists()
        return False