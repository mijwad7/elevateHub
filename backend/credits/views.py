from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import Credit, CreditTransaction
from .serializers import CreditSerializer, CreditTransactionSerializer

class CreditBalanceView(generics.RetrieveAPIView):
    serializer_class = CreditSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user.get_credits()

class CreditTransactionListView(generics.ListAPIView):
    serializer_class = CreditTransactionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return CreditTransaction.objects.filter(user=self.request.user)