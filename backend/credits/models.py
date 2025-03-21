from django.db import models
from django.conf import settings

class Credit(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='credits')
    balance = models.IntegerField(default=0)

    def __str__(self):
        return f"{self.user.username}: {self.balance} credits"

    def add_credits(self, amount, description="Earned credits"):
        self.balance += amount
        self.save()
        CreditTransaction.objects.create(user=self.user, amount=amount, description=description)

    def spend_credits(self, amount, description="Spent credits"):
        if amount <= self.balance:
            self.balance -= amount
            self.save()
            CreditTransaction.objects.create(user=self.user, amount=-amount, description=description)
            return True
        return False

class CreditTransaction(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='credit_transactions')
    amount = models.IntegerField()  # Positive for earning, negative for spending
    description = models.CharField(max_length=255)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username}: {self.amount} ({self.description})"