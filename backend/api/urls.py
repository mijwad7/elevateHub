from django.urls import path
from .views import (
    DiscussionListCreateView, DiscussionDetailView,
    DiscussionPostListCreateView, DiscussionPostDetailView, toggle_upvote, CategoryListView,
    PasswordResetRequestView, PasswordResetConfirmView,
)

urlpatterns = [
    path('categories/', CategoryListView.as_view(), name='category_list'),
    path('discussions/', DiscussionListCreateView.as_view(), name='discussion-list'),
    path('discussions/<int:pk>/', DiscussionDetailView.as_view(), name='discussion-detail'),
    path('discussions/<int:discussion_id>/posts/', DiscussionPostListCreateView.as_view(), name='discussion-post-list'),
    path('posts/<int:pk>/', DiscussionPostDetailView.as_view(), name='discussion-post-detail'),
    path('posts/<int:post_id>/toggle-upvote/', toggle_upvote, name='toggle-upvote'),
    path("reset-password/", PasswordResetRequestView.as_view(), name="password_reset_request"),
    path("reset-password/<uidb64>/<token>/", PasswordResetConfirmView.as_view(), name="password_reset_confirm"),
]
