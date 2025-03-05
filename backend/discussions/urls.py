from django.urls import path
from .views import (
    DiscussionListCreateView, DiscussionDetailView,
    DiscussionPostListCreateView, DiscussionPostDetailView, toggle_upvote, CategoryListView,
)

urlpatterns = [
    path('categories/', CategoryListView.as_view(), name='category_list'),
    path('discussions/', DiscussionListCreateView.as_view(), name='discussion-list'),
    path('discussions/<int:pk>/', DiscussionDetailView.as_view(), name='discussion-detail'),
    path('discussions/<int:discussion_id>/posts/', DiscussionPostListCreateView.as_view(), name='discussion-post-list'),
    path('posts/<int:pk>/', DiscussionPostDetailView.as_view(), name='discussion-post-detail'),
    path('posts/<int:post_id>/toggle-upvote/', toggle_upvote, name='toggle-upvote'),
]