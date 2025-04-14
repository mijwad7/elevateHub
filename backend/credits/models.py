# credits/models.py
from django.db import models
from django.conf import settings
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from django.db.models.signals import post_save
from django.dispatch import receiver
from projects.models import Notification

class Credit(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='credits')
    balance = models.IntegerField(default=0)

    def __str__(self):
        return f"{self.user.username}: {self.balance} credits"

    def add_credits(self, amount, description="Earned credits"):
        self.balance += amount
        self.save()
        transaction = CreditTransaction.objects.create(user=self.user, amount=amount, description=description)
        return transaction

    def spend_credits(self, amount, description="Spent credits"):
        if amount <= self.balance:
            self.balance -= amount
            self.save()
            transaction = CreditTransaction.objects.create(user=self.user, amount=-amount, description=description)
            return transaction
        return False

    def _send_notification(self, type, amount, description, skip_signal=False):
        # Create a notification message based on the type of transaction
        if type == 'credit_added':
            message = f"You have earned {amount} credits: {description}"
        elif type == 'credit_spent':
            message = f"You have spent {abs(amount)} credits: {description}"
        else:
            return  # If the type is not recognized, do nothing

        # Create the notification instance
        Notification.objects.create(
            user=self.user,
            message=message,
            notification_type=type
        )

        # Optionally, you can still send the notification through the channel layer if needed
        channel_layer = get_channel_layer()
        if channel_layer:
            async_to_sync(channel_layer.group_send)(
                f'notifications_{self.user.id}',
                {
                    'type': 'notification',
                    'notification': {
                        'id': None,  # You may want to set this to the ID of the created notification if needed
                        'message': message,
                        'is_read': False,
                        'created_at': None,  # You can set this to the current time if needed
                        'notification_type': type,
                        'link': None  # Optional link if you want to provide one
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
        
        # Create a notification for the user
        notification_message = f"{'Earned' if instance.amount > 0 else 'Spent'} {abs(instance.amount)} credits: {instance.description}"
        Notification.objects.create(
            user=instance.user,
            message=notification_message,
            notification_type=type
        )
        
        credit._send_notification(type, instance.amount, instance.description)