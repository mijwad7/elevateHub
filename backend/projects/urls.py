from django.urls import path
from .views import (
    HelpRequestListCreateView, HelpRequestDetailView,
    HelpCommentListCreateView, HelpCommentDetailView,
    toggle_upvote, CategoryListView
)

urlpatterns = [
    path('categories/', CategoryListView.as_view(), name='category_list'),
    path('help-requests/', HelpRequestListCreateView.as_view(), name='help-request-list'),
    path('help-requests/<int:pk>/', HelpRequestDetailView.as_view(), name='help-request-detail'),
    path('help-requests/<int:request_id>/comments/', HelpCommentListCreateView.as_view(), name='help-comment-list'),
    path('help-comments/<int:pk>/', HelpCommentDetailView.as_view(), name='help-comment-detail'),
    path('help-comments/<int:comment_id>/toggle-upvote/', toggle_upvote, name='toggle-upvote'),
]