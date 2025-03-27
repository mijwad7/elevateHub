from django.urls import path
from .views import (
    HelpRequestListCreateView, HelpRequestDetailView,
    HelpCommentListCreateView, HelpCommentDetailView,
    toggle_upvote, CategoryListView, start_chat, end_chat
)

urlpatterns = [
    path('categories/', CategoryListView.as_view(), name='category_list'),
    path('help-requests/', HelpRequestListCreateView.as_view(), name='help-request-list'),
    path('help-requests/<int:pk>/', HelpRequestDetailView.as_view(), name='help-request-detail'),
    path('help-requests/<int:request_id>/comments/', HelpCommentListCreateView.as_view(), name='help-comment-list'),
    path('help-requests/<int:request_id>/comments/<int:pk>/', HelpCommentDetailView.as_view(), name='help-comment-detail'),
    path('help-requests/<int:request_id>/comments/<int:comment_id>/toggle-upvote/', toggle_upvote, name='toggle-upvote'),
    path('help-requests/<int:request_id>/start-chat/', start_chat, name='start-chat'),
    path('chat/<int:chat_id>/end/', end_chat, name='end-chat'),
]