from rest_framework import serializers
from .models import Credit, CreditTransaction

class CreditSerializer(serializers.ModelSerializer):
    class Meta:
        model = Credit
        fields = ['balance']

class CreditTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = CreditTransaction
        fields = ['amount', 'description', 'timestamp']