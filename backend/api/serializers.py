from django.contrib.auth.models import User
from rest_framework import serializers
from .models import CustomUser, Discussion, DiscussionPost, Category
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.core.mail import send_mail
from django.contrib.auth import get_user_model
from django.conf import settings


User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ["id", "username", "email", "password", "profile_image", "is_staff"]
        extra_kwargs = {"password": {"write_only": True}}

    def create(self, validated_data):
        user = CustomUser.objects.create_user(**validated_data)
        return user


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        if not User.objects.filter(email=value).exists():
            raise serializers.ValidationError("User with this email does not exist.")
        return value

    def send_reset_email(self):
        email = self.validated_data["email"]
        user = User.objects.get(email=email)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)

        reset_link = f"http://localhost:5173/reset-password/{uid}/{token}/"

        send_mail(
            subject="Password Reset Request",
            message=f"Click the link below to reset your password:\n{reset_link}",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
        )


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name"]


class DiscussionSerializer(serializers.ModelSerializer):
    created_by_username = serializers.ReadOnlyField(source="created_by.username")
    created_by_profile = serializers.SerializerMethodField()
    category = CategorySerializer(read_only=True)  # Changed to show category details
    # category_id = serializers.PrimaryKeyRelatedField(
    #     queryset=Category.objects.all(), source="category", write_only=True
    # )  # Allow setting category via ID
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
    has_upvoted = serializers.SerializerMethodField()

    class Meta:
        model = DiscussionPost
        fields = [
            "id",
            "discussion",
            "user",
            "user_username",
            "content",
            "upvotes",
            "created_at",
            "has_upvoted",
        ]
        read_only_fields = ["user", "discussion", "created_at"]

    def get_has_upvoted(self, obj):
        user = self.context.get("request").user
        if user and user.is_authenticated:
            return obj.post_upvotes.filter(user=user).exists()
        return False
