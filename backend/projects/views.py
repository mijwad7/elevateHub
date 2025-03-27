from rest_framework import generics, permissions
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import HelpRequest, HelpComment, HelpCommentUpvote, ChatSession
from .serializers import HelpRequestSerializer, HelpCommentSerializer, ChatSessionSerializer
from rest_framework.filters import SearchFilter, OrderingFilter
from api.models import Category
from .serializers import CategorySerializer
from credits.models import CreditTransaction  # Adjust if path differs


class CategoryListView(generics.ListAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

class HelpRequestListCreateView(generics.ListCreateAPIView):
    serializer_class = HelpRequestSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['title', 'description']
    ordering_fields = ['created_at']
    ordering = ['-created_at']

    def get_queryset(self):
        queryset = HelpRequest.objects.all()
        category_id = self.request.query_params.get('category')
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
        request_id = self.kwargs.get('request_id')
        return HelpComment.objects.filter(help_request_id=request_id).order_by('-created_at')

    def perform_create(self, serializer):
        request_id = self.kwargs.get("request_id")
        help_request = get_object_or_404(HelpRequest, id=request_id)
        serializer.save(user=self.request.user, help_request=help_request)

class HelpCommentDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = HelpComment.objects.all()
    serializer_class = HelpCommentSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_upvote(request, request_id, comment_id):
    comment = get_object_or_404(HelpComment, help_request_id=request_id, id=comment_id)
    upvote, created = HelpCommentUpvote.objects.get_or_create(user=request.user, comment=comment)
    if not created:
        upvote.delete()
        comment.upvotes -= 1
        comment.save(update_fields=['upvotes'])
        return Response({"detail": "Upvote removed"}, status=status.HTTP_200_OK)
    return Response({"detail": "Upvote added"}, status=status.HTTP_201_CREATED)



@api_view(['POST'])
@permission_classes([IsAuthenticated])
def start_chat(request, request_id):
    help_request = get_object_or_404(HelpRequest, id=request_id)
    if help_request.credit_offer_chat <= 0 or request.user == help_request.created_by:
        return Response({"detail": "Cannot start chat"}, status=status.HTTP_400_BAD_REQUEST)
    chat_session, created = ChatSession.objects.get_or_create(
        help_request=help_request,
        requester=help_request.created_by,
        helper=request.user,
        is_active=True
    )
    return Response(ChatSessionSerializer(chat_session).data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

@api_view(['POST'])
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
        description=f"Chat help for {chat_session.help_request.title}"
    )
    CreditTransaction.objects.create(
        user=chat_session.helper,
        amount=credits,
        description=f"Earned from chat help on {chat_session.help_request.title}"
    )
    return Response({"detail": "Chat ended"}, status=status.HTTP_200_OK)