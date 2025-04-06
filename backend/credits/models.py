# credits/models.py
from django.db import models
from django.conf import settings
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from django.db.models.signals import post_save
from django.dispatch import receiver

class Credit(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='credits')
    balance = models.IntegerField(default=0)

    def __str__(self):
        return f"{self.user.username}: {self.balance} credits"

    def add_credits(self, amount, description="Earned credits"):
        self.balance += amount
        self.save()
        transaction = CreditTransaction.objects.create(user=self.user, amount=amount, description=description)
        self._send_notification('credit_added', amount, description, skip_signal=True)  # Avoid double notification
        return transaction

    def spend_credits(self, amount, description="Spent credits"):
        if amount <= self.balance:
            self.balance -= amount
            self.save()
            transaction = CreditTransaction.objects.create(user=self.user, amount=-amount, description=description)
            self._send_notification('credit_spent', amount, description, skip_signal=True)  # Avoid double notification
            return transaction
        return False


    def _send_notification(self, type, amount, description, skip_signal=False):
        channel_layer = get_channel_layer()
        if channel_layer:
            async_to_sync(channel_layer.group_send)(
                'notifications',
                {
                    'type': 'notification',
                    'notification': {
                        'type': type,
                        'amount': amount,
                        'description': description,
                        'user_id': self.user.id,
                        'timestamp': self.user.credit_transactions.latest('timestamp').timestamp.isoformat()
                    }
                }
            )


class CreditTransaction(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='credit_transactions')
    amount = models.IntegerField()
    description = models.CharField(max_length=255)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username}: {self.amount} ({self.description})"

@receiver(post_save, sender=CreditTransaction)
def transaction_created(sender, instance, created, **kwargs):
    if created:  # Only on new transactions
        credit = instance.user.get_credits()  # Access related Credit object
        type = 'credit_added' if instance.amount > 0 else 'credit_spent'
        credit._send_notification(type, instance.amount, instance.description)