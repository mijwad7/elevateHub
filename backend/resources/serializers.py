from rest_framework import serializers
from .models import Resource, ResourceVote
from api.models import Category


class ResourceCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name"]


class ResourceSerializer(serializers.ModelSerializer):
    uploaded_by_username = serializers.ReadOnlyField(source="uploaded_by.username")
    category = ResourceCategorySerializer(read_only=True)
    has_upvoted = serializers.SerializerMethodField()

    def get_has_upvoted(self, obj):
        user = self.context["request"].user
        return user.is_authenticated and obj.votes.filter(user=user).exists()

    class Meta:
        model = Resource
        fields = [
            "id",
            "title",
            "description",
            "file",
            "category",
            "uploaded_by",
            "uploaded_by_username",
            "created_at",
            "upvotes",
            "download_count",
            "has_upvoted",
        ]
