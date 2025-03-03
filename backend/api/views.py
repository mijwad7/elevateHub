from django.contrib.auth.models import User
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import generics, permissions
from .serializers import UserSerializer, DiscussionSerializer, DiscussionPostSerializer, CategorySerializer, PasswordResetRequestSerializer
from rest_framework.permissions import AllowAny
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import CustomUser, Discussion, DiscussionPost, DiscussionPostUpvote, Category
from rest_framework.decorators import api_view, permission_classes
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_decode
from django.contrib.auth import get_user_model

User = get_user_model()


# ✅ Custom serializer to include user details in login response
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        data["user"] = {
            "id": self.user.id,
            "username": self.user.username,
            "email": self.user.email,
            "profile_image": self.user.profile_image.url if self.user.profile_image else None,
            "is_staff": self.user.is_staff
        }
        return data

# ✅ Custom token view to use the above serializer
class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

# ✅ Register view
class CreateUserView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]


class UserListView(generics.ListAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAdminUser]  # Ensure only admins can fetch users

    def get_queryset(self):
        query = self.request.query_params.get("q", "")
        return self.queryset.filter(username__icontains=query)

class UserDeleteView(generics.DestroyAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAdminUser]

class ProfileImageUploadView(APIView):
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [permissions.IsAuthenticated]

    def put(self, request, user_id):
        try:
            user = CustomUser.objects.get(id=user_id)
            user.profile_image = request.FILES.get('profile_image')
            user.save()
            return Response(UserSerializer(user).data)
        except CustomUser.DoesNotExist:
            return Response({"error": "User not found"}, status=404)


class UserListCreateView(generics.ListCreateAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        query = self.request.query_params.get("q", "")
        return self.queryset.filter(username__icontains=query)

class UserRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAdminUser]

class CategoryListView(generics.ListAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

class DiscussionListCreateView(generics.ListCreateAPIView):
    queryset = Discussion.objects.all()
    serializer_class = DiscussionSerializer

    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

class DiscussionDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Discussion.objects.all()
    serializer_class = DiscussionSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

class DiscussionPostListCreateView(generics.ListCreateAPIView):
    serializer_class = DiscussionPostSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        discussion_id = self.kwargs.get('discussion_id')
        return DiscussionPost.objects.filter(discussion_id=discussion_id).order_by('-created_at')

    def perform_create(self, serializer):
        discussion_id = self.kwargs.get("discussion_id")  # Get discussion_id from URL
        discussion = get_object_or_404(Discussion, id=discussion_id)  # Fetch the discussion
        serializer.save(user=self.request.user, discussion=discussion) 


class DiscussionPostDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = DiscussionPost.objects.all()
    serializer_class = DiscussionPostSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_upvote(request, post_id):
    try:
        post = DiscussionPost.objects.get(id=post_id)
        upvote, created = DiscussionPostUpvote.objects.get_or_create(user=request.user, post=post)
        if not created:
            upvote.delete()
            post.upvotes -= 1
            message = "Upvote removed"
        else:
            post.upvotes += 1
            message = "Upvote added"
        post.save()
        return Response({"message": message, "upvotes": post.upvotes}, status=status.HTTP_200_OK)

    except DiscussionPost.DoesNotExist:
        return Response({"error": "Post not found"}, status=status.HTTP_404_NOT_FOUND)


class PasswordResetRequestView(APIView):
    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        if serializer.is_valid():
            serializer.send_reset_email()
            return Response({"message": "Password reset email sent."}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class PasswordResetConfirmView(APIView):
    def post(self, request, uidb64, token):
        try:
            uid = urlsafe_base64_decode(uidb64).decode()
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response({"error": "Invalid token"}, status=status.HTTP_400_BAD_REQUEST)

        if not default_token_generator.check_token(user, token):
            return Response({"error": "Invalid or expired token"}, status=status.HTTP_400_BAD_REQUEST)

        new_password = request.data.get("password")
        if not new_password:
            return Response({"error": "Password is required"}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()
        return Response({"message": "Password reset successful."}, status=status.HTTP_200_OK)
