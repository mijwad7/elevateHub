from rest_framework import serializers
from .models import Discussion, DiscussionPost, Category

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name"]

class DiscussionSerializer(serializers.ModelSerializer):
    created_by_username = serializers.ReadOnlyField(source="created_by.username")
    created_by_profile = serializers.SerializerMethodField()
    category = CategorySerializer(read_only=True)
    posts_count = serializers.SerializerMethodField()
    created_at_formatted = serializers.SerializerMethodField()

    def get_created_by_profile(self, obj):
        return (
            obj.created_by.profile_image.url if obj.created_by.profile_image else None
        )

    def get_posts_count(self, obj):
        return obj.posts.count()

    def get_created_at_formatted(self, obj):
        return obj.created_at.strftime("%b %d, %Y")

    class Meta:
        model = Discussion
        fields = [
            "id",
            "title",
            "description",
            "category",
            "created_by",
            "created_by_username",
            "created_by_profile",
            "created_at_formatted",
            "posts_count",
        ]
        read_only_fields = ["created_by", "created_at"]

class DiscussionPostSerializer(serializers.ModelSerializer):
    user_username = serializers.ReadOnlyField(source="user.username")
    user_profile = serializers.SerializerMethodField()
    has_upvoted = serializers.SerializerMethodField()

    class Meta:
        model = DiscussionPost
        fields = [
            "id",
            "discussion",
            "user",
            "user_username",
            "user_profile",
            "content",
            "upvotes",
            "created_at",
            "has_upvoted",
        ]
        read_only_fields = ["user", "discussion", "created_at"]

    def get_user_profile(self, obj):
        return obj.user.profile_image.url if obj.user.profile_image else None

    def get_has_upvoted(self, obj):
        user = self.context.get("request").user
        if user and user.is_authenticated:
            return obj.post_upvotes.filter(user=user).exists()
        return False