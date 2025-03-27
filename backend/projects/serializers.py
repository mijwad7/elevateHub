from rest_framework import serializers
from .models import HelpRequest, HelpComment, ChatMessage, ChatSession
from api.serializers import UserSerializer
from api.models import Category

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name"]

class HelpCommentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    help_request = serializers.PrimaryKeyRelatedField(read_only=True)
    has_upvoted = serializers.SerializerMethodField()

    def get_has_upvoted(self, obj):
        user = self.context["request"].user
        return user.is_authenticated and obj.comment_upvotes.filter(user=user).exists()

    class Meta:
        model = HelpComment
        fields = ['id', 'help_request', 'user', 'content', 'upvotes', 'created_at', 'has_upvoted']

class HelpRequestSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        source='category',
        write_only=True
    )
    comments = HelpCommentSerializer(many=True, read_only=True)

    class Meta:
        model = HelpRequest
        fields = ['id', 'title', 'description', 'category', 'category_id', 'created_by', 'created_at', 'status', 'credit_offer_chat', 'credit_offer_video', 'comments']
        read_only_fields = ['created_by', 'created_at', 'status', 'comments']


# project_help/serializers.py
class ChatMessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    class Meta:
        model = ChatMessage
        fields = ['id', 'sender', 'content', 'timestamp']

class ChatSessionSerializer(serializers.ModelSerializer):
    requester = UserSerializer(read_only=True)
    helper = UserSerializer(read_only=True)
    help_request = serializers.PrimaryKeyRelatedField(read_only=True)
    messages = ChatMessageSerializer(many=True, read_only=True)

    class Meta:
        model = ChatSession
        fields = ['id', 'help_request', 'requester', 'helper', 'created_at', 'is_active', 'messages']