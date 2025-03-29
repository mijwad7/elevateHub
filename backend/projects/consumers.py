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
        except ChatSession.DoesNotExist:
            logger.error(f"ChatSession {self.chat_id} not found")
            await self.close(code=4000, reason="Chat session not found")
        except Exception as e:
            logger.error(f"Connect error: {str(e)}")
            await self.close(code=1011, reason="Server error")

    async def disconnect(self, close_code):
        logger.info(f"Disconnected from {self.chat_group_name}, code: {close_code}")
        await self.channel_layer.group_discard(self.chat_group_name, self.channel_name)

    async def receive(self, text_data):
        logger.info(f"Received: {text_data}")
        data = json.loads(text_data)
        message = data.get('message', '')
        sender = self.scope['user']
        try:
            chat_message = await database_sync_to_async(ChatMessage.objects.create)(
                chat_session=self.chat_session,
                sender=sender,
                content=message
            )
            sender_data = await database_sync_to_async(lambda: UserSerializer(sender).data)()
            message_data = {
                'id': chat_message.id,
                'sender': sender_data,
                'content': message,
                'timestamp': chat_message.timestamp.isoformat()
            }
            logger.info(f"Sending to group: {message_data}")
            await self.channel_layer.group_send(
                self.chat_group_name,
                {
                    'type': 'chat_message',
                    'message': message_data
                }
            )
        except Exception as e:
            logger.error(f"Receive error: {str(e)}")
            await self.close(code=1011, reason="Server error")

    async def chat_message(self, event):
        logger.info(f"Broadcasting: {event['message']}")
        await self.send(text_data=json.dumps(event['message']))