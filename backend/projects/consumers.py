# projects/consumers.py
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
import json
from .models import ChatSession, ChatMessage
from api.serializers import UserSerializer
import logging

logger = logging.getLogger(__name__)

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.chat_id = self.scope['url_route']['kwargs']['chat_id']
        self.chat_group_name = f'chat_{self.chat_id}'
        logger.info(f"Connecting to chat_id: {self.chat_id}")
        try:
            self.chat_session = await database_sync_to_async(ChatSession.objects.get)(id=self.chat_id, is_active=True)
            user = self.scope['user']
            logger.info(f"User: {user}, Authenticated: {user.is_authenticated}")
            if user.is_anonymous:
                logger.warning("Anonymous user rejected")
                await self.close(code=4001, reason="Authentication required")
                return
            await self.channel_layer.group_add(self.chat_group_name, self.channel_name)
            await self.accept()
            await self.send(text_data=json.dumps({"message": "Connected to chat"}))
            messages = await self.get_chat_history()
            for msg in messages:
                await self.send(text_data=json.dumps(msg))
        except ChatSession.DoesNotExist:
            logger.error(f"ChatSession {self.chat_id} not found")
            await self.close(code=4000, reason="Chat session not found")
        except Exception as e:
            logger.error(f"Connect error: {str(e)}")
            await self.close(code=1011, reason="Server error")

    @database_sync_to_async
    def get_chat_history(self):
        messages = ChatMessage.objects.filter(chat_session=self.chat_session).order_by('timestamp')
        return [{
            'id': msg.id,
            'sender': UserSerializer(msg.sender).data,  # Direct serialization, no async needed
            'content': msg.content,
            'timestamp': msg.timestamp.isoformat()
        } for msg in messages]

    async def disconnect(self, close_code):
        logger.info(f"Disconnected from {self.chat_group_name}, code: {close_code}")
        await self.channel_layer.group_discard(self.chat_group_name, self.channel_name)

    async def receive(self, text_data):
        logger.info(f"Received: {text_data}")
        data = json.loads(text_data)
        message = data.get('message', '')
        if not message:
            return
        sender = self.scope['user']
        try:
            chat_message = await database_sync_to_async(ChatMessage.objects.create)(
                chat_session=self.chat_session,
                sender=sender,
                content=message
            )
            message_data = {
                'id': chat_message.id,
                'sender': UserSerializer(sender).data,  # Direct serialization
                'content': message,
                'timestamp': chat_message.timestamp.isoformat()
            }
            # Send to others only
            await self.channel_layer.group_send(
                self.chat_group_name,
                {
                    'type': 'chat_message',
                    'message': message_data,
                    'sender_channel': self.channel_name
                }
            )
            # Send to sender locally
            await self.send(text_data=json.dumps(message_data))
        except Exception as e:
            logger.error(f"Receive error: {str(e)}")
            await self.close(code=1011, reason="Server error")

    async def chat_message(self, event):
        message_data = event['message']
        sender_channel = event.get('sender_channel')
        if self.channel_name != sender_channel:  # Only broadcast to others
            logger.info(f"Broadcasting to {self.channel_name}: {message_data}")
            await self.send(text_data=json.dumps(message_data))