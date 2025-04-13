from django.urls import path
from .views import (
    HelpRequestListCreateView, HelpRequestDetailView,
    HelpCommentListCreateView, HelpCommentDetailView,
    toggle_upvote, CategoryListView, start_chat, end_chat, active_chats, StartVideoCall, EndVideoCall,
    NotificationViewSet
)
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'notifications', NotificationViewSet, basename='notification')

urlpatterns = [
    path('active-chats/', active_chats, name='active-chats'),
    path('categories/', CategoryListView.as_view(), name='category_list'),
    path('help-requests/', HelpRequestListCreateView.as_view(), name='help-request-list'),
    path('help-requests/<int:pk>/', HelpRequestDetailView.as_view(), name='help-request-detail'),
    path('help-requests/<int:request_id>/comments/', HelpCommentListCreateView.as_view(), name='help-comment-list'),
    path('help-requests/<int:request_id>/comments/<int:pk>/', HelpCommentDetailView.as_view(), name='help-comment-detail'),
    path('help-requests/<int:request_id>/comments/<int:comment_id>/toggle-upvote/', toggle_upvote, name='toggle-upvote'),
    path('help-requests/<int:request_id>/start-chat/', start_chat, name='start-chat'),
    path('chat/<int:chat_id>/end/', end_chat, name='end-chat'),
    path('start-video/<int:request_id>/', StartVideoCall.as_view(), name='start-video-call'),
    path('end-video/<int:call_id>/', EndVideoCall.as_view(), name='end-video-call'),
] + router.urls