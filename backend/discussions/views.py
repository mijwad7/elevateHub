from rest_framework import generics, permissions
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import Discussion, DiscussionPost, DiscussionPostUpvote, Category
from .serializers import DiscussionSerializer, DiscussionPostSerializer, CategorySerializer
from rest_framework.filters import SearchFilter, OrderingFilter
import logging

logger = logging.getLogger(__name__)

class CategoryListView(generics.ListAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

class DiscussionListCreateView(generics.ListCreateAPIView):
    serializer_class = DiscussionSerializer
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'upvotes', 'posts']
    ordering = ['-created_at']

    def get_queryset(self):
        logger.info(f"Retrieving discussions with category filter: {self.request.query_params.get('category')}")
        queryset = Discussion.objects.all()
        category_id = self.request.query_params.get('category')
        if category_id:
            queryset = queryset.filter(category__id=category_id)
        return queryset

    def perform_create(self, serializer):
        logger.info(f"Creating new discussion for user {self.request.user.username}")
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
        logger.info(f"Retrieving posts for discussion {discussion_id}")
        return DiscussionPost.objects.filter(discussion_id=discussion_id).order_by('-created_at')

    def perform_create(self, serializer):
        discussion_id = self.kwargs.get("discussion_id")
        discussion = get_object_or_404(Discussion, id=discussion_id)
        logger.info(f"User {self.request.user.username} creating post in discussion {discussion_id}")
        serializer.save(user=self.request.user, discussion=discussion)

class DiscussionPostDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = DiscussionPost.objects.all()
    serializer_class = DiscussionPostSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

@api_view(['POST'])
def toggle_upvote(request, post_id):
    try:
        post = DiscussionPost.objects.get(id=post_id)
        logger.info(f"User {request.user.username} toggling upvote on post {post_id}")
        upvote, created = DiscussionPostUpvote.objects.get_or_create(user=request.user, post=post)
        if not created:
            upvote.delete()
            post.upvotes -= 1
            post.save()
            message = "Upvote removed"
        else:
            message = "Upvote added"
        return Response({"message": message, "upvotes": post.upvotes}, status=status.HTTP_200_OK)
    except DiscussionPost.DoesNotExist:
        logger.warning(f"Attempted to upvote non-existent post {post_id}")
        return Response({"error": "Post not found"}, status=status.HTTP_404_NOT_FOUND)
