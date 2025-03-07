from rest_framework import serializers
from .models import Resource, ResourceVote
from api.models import Category


class ResourceCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name"]


class ResourceSerializer(serializers.ModelSerializer):
    uploaded_by_username = serializers.ReadOnlyField(source="uploaded_by.username")
    uploaded_by_profile = serializers.ImageField(
        source="uploaded_by.profile_image", read_only=True
    )
    category = serializers.PrimaryKeyRelatedField(queryset=Category.objects.all())
    category_detail = ResourceCategorySerializer(source="category", read_only=True)
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
            "category_detail",
            "uploaded_by",
            "uploaded_by_username",
            "uploaded_by_profile",
            "created_at",
            "upvotes",
            "download_count",
            "has_upvoted",
        ]
