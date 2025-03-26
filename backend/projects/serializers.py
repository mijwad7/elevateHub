from rest_framework import serializers
from .models import HelpRequest, HelpComment
from api.serializers import UserSerializer
from api.models import Category

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name"]

class HelpCommentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    help_request = serializers.PrimaryKeyRelatedField(read_only=True)
    class Meta:
        model = HelpComment
        fields = ['id', 'help_request', 'user', 'content', 'upvotes', 'created_at']

class HelpRequestSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    category = CategorySerializer(read_only=True)  # For response (read)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        source='category',
        write_only=True  # For request (write)
    )
    comments = HelpCommentSerializer(many=True, read_only=True)

    class Meta:
        model = HelpRequest
        fields = ['id', 'title', 'description', 'category', 'category_id', 'created_by', 'created_at', 'status', 'credit_offer_chat', 'credit_offer_video', 'comments']
        read_only_fields = ['created_by', 'created_at', 'status', 'comments']