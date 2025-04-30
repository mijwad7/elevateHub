from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import Credit, CreditTransaction
from .serializers import CreditSerializer, CreditTransactionSerializer
import logging

logger = logging.getLogger(__name__)

class CreditBalanceView(generics.RetrieveAPIView):
    serializer_class = CreditSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        logger.info(f"Retrieving credit balance for user {self.request.user.username}")
        return self.request.user.get_credits()

class CreditTransactionListView(generics.ListAPIView):
    serializer_class = CreditTransactionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        logger.info(f"Retrieving credit transactions for user {self.request.user.username}")
        return CreditTransaction.objects.filter(user=self.request.user).order_by('-timestamp')
    

