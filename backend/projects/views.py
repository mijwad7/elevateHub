from rest_framework import generics, permissions, status, viewsets
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.filters import SearchFilter, OrderingFilter
from django.shortcuts import get_object_or_404
from django.db.models import Q
from django.conf import settings
from django.utils import timezone
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import (
    HelpRequest,
    HelpComment,
    HelpCommentUpvote,
    ChatSession,
    VideoCall,
    Notification
)
from .serializers import (
    HelpRequestSerializer,
    HelpCommentSerializer,
    ChatSessionSerializer,
    NotificationSerializer,
    CategorySerializer
)
from api.models import Category
from api.serializers import UserSerializer
from credits.models import CreditTransaction

import logging

logger = logging.getLogger(__name__)


class CategoryListView(generics.ListAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticatedOrReadOnly]


class HelpRequestListCreateView(generics.ListCreateAPIView):
    serializer_class = HelpRequestSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ["title", "description"]
    ordering_fields = ["created_at"]
    ordering = ["-created_at"]

    def get_queryset(self):
        queryset = HelpRequest.objects.all()
        category_id = self.request.query_params.get("category")
        if category_id:
            queryset = queryset.filter(category__id=category_id)
        return queryset

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class HelpRequestDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = HelpRequest.objects.all()
    serializer_class = HelpRequestSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]


class HelpCommentListCreateView(generics.ListCreateAPIView):
    serializer_class = HelpCommentSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        request_id = self.kwargs.get("request_id")
        return HelpComment.objects.filter(help_request_id=request_id).order_by(
            "-created_at"
        )

    def perform_create(self, serializer):
        request_id = self.kwargs.get("request_id")
        help_request = get_object_or_404(HelpRequest, id=request_id)
        serializer.save(user=self.request.user, help_request=help_request)


class HelpCommentDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = HelpComment.objects.all()
    serializer_class = HelpCommentSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def toggle_upvote(request, request_id, comment_id):
    comment = get_object_or_404(HelpComment, help_request_id=request_id, id=comment_id)
    upvote, created = HelpCommentUpvote.objects.get_or_create(
        user=request.user, comment=comment
    )
    if not created:
        upvote.delete()
        comment.upvotes -= 1
        comment.save(update_fields=["upvotes"])
        return Response({"detail": "Upvote removed"}, status=status.HTTP_200_OK)
    return Response({"detail": "Upvote added"}, status=status.HTTP_201_CREATED)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def start_chat(request, request_id):
    help_request = get_object_or_404(HelpRequest, id=request_id)
    if help_request.credit_offer_chat <= 0 or request.user == help_request.created_by:
        return Response(
            {"detail": "Cannot start chat"}, status=status.HTTP_400_BAD_REQUEST
        )
    chat_session, created = ChatSession.objects.get_or_create(
        help_request=help_request,
        requester=help_request.created_by,
        helper=request.user,
        is_active=True,
    )
    return Response(
        ChatSessionSerializer(chat_session).data,
        status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def end_chat(request, chat_id):
    chat_session = get_object_or_404(ChatSession, id=chat_id, is_active=True)
    if request.user not in [chat_session.requester, chat_session.helper]:
        return Response({"detail": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
    chat_session.is_active = False
    chat_session.save()

    credits = chat_session.help_request.credit_offer_chat  # Use help_request field
    CreditTransaction.objects.create(
        user=chat_session.requester,
        amount=-credits,
        description=f"Chat help for {chat_session.help_request.title}",
    )
    CreditTransaction.objects.create(
        user=chat_session.helper,
        amount=credits,
        description=f"Earned from chat help on {chat_session.help_request.title}",
    )

    # Notify all participants via WebSocket
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f"chat_{chat_id}",
        {
            'type': 'chat_ended',
            'message': {'status': 'chat_ended'}
        }
    )

    return Response({"detail": "Chat ended"}, status=status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def active_chats(request):
    user = request.user
    active_sessions = (
        ChatSession.objects.filter(is_active=True)
        .filter(Q(requester=user) | Q(helper=user))
        .select_related("requester", "helper", "help_request")
    )

    data = [
        {
            "id": session.id,
            "requester": UserSerializer(session.requester).data,
            "helper": UserSerializer(session.helper).data,
            "help_request": (
                {
                    "id": session.help_request.id,
                    "title": session.help_request.title,
                }
                if session.help_request
                else None
            ),
            "created_at": session.created_at.isoformat(),
        }
        for session in active_sessions
    ]

    return Response(data)


class StartVideoCall(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, request_id):
        try:
            help_request = HelpRequest.objects.get(id=request_id)
            if request.user == help_request.created_by:
                logger.warning(f"User {request.user.username} attempted to start video call on own request {request_id}")
                return Response({'error': 'Only helpers can start video calls'}, status=403)
            
            video_call = VideoCall.objects.create(
                help_request=help_request,
                requester=help_request.created_by,
                helper=request.user
            )
            logger.info(f"Created VideoCall ID: {video_call.id} for HelpRequest {request_id}")

            # Create notification for requester
            notification_message = f"{request.user.username} has started a video call for '{help_request.title}'"
            Notification.objects.create(
                user=help_request.created_by,
                message=notification_message,
                notification_type="video_call_started",
                link=None
            )
            logger.info(f"Created Notification for user {help_request.created_by.username}")

            return Response({'call_id': video_call.id, 'status': 'Video call started'}, status=200)
        
        except HelpRequest.DoesNotExist:
            logger.error(f"HelpRequest {request_id} not found")
            return Response({'error': 'Help request not found'}, status=404)

class EndVideoCall(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, call_id):
        try:
            video_call = VideoCall.objects.get(id=call_id)
            if request.user not in [video_call.requester, video_call.helper]:
                return Response({'error': 'Unauthorized'}, status=403)
            if not video_call.is_active:
                return Response({'error': 'Call already ended'}, status=400)
            
            # End the call
            video_call.end_call()
            
            # Handle credit transactions
            amount = video_call.help_request.credit_offer_video
            requester_credits = video_call.requester.get_credits()
            helper_credits = video_call.helper.get_credits()
            requester_credits.spend_credits(amount, f"Video call completed for {video_call.help_request.title}")
            helper_credits.add_credits(amount, f"Helped via video for {video_call.help_request.title}")
            
            # Create notifications for both users
            Notification.objects.create(
                user=video_call.requester,
                message=f"Video call for '{video_call.help_request.title}' has ended. You spent {amount} credits.",
                notification_type='success',
                link=f"/help-requests/{video_call.help_request.id}"
            )
            Notification.objects.create(
                user=video_call.helper,
                message=f"Video call for '{video_call.help_request.title}' has ended. You earned {amount} credits.",
                notification_type='success',
                link=f"/help-requests/{video_call.help_request.id}"
            )
            
            # Notify all participants via WebSocket
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                f"video_call_{call_id}",
                {
                    'type': 'call_ended',
                    'message': {'status': 'call_ended'}
                }
            )
            
            return Response({'status': 'Video call ended'})
        except VideoCall.DoesNotExist:
            return Response({'error': 'Video call not found'}, status=404)

class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)

    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response({'status': 'marked as read'})

    @action(detail=False, methods=['post'])
    def mark_all_as_read(self, request):
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({'status': 'all notifications marked as read'})

    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        count = Notification.objects.filter(user=request.user, is_read=False).count()
        return Response({'count': count})