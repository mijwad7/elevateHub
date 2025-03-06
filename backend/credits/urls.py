from django.urls import path
from .views import CreditBalanceView, CreditTransactionListView

urlpatterns = [
    path('credits/balance/', CreditBalanceView.as_view(), name='credit-balance'),
    path('credits/transactions/', CreditTransactionListView.as_view(), name='credit-transactions'),
]