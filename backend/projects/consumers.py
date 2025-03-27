# project_help/consumers.py
from channels.generic.websocket import AsyncWebsocketConsumer
import json
from .models import ChatSession, ChatMessage
from api.serializers import UserSerializer

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.chat_id = self.scope['url_route']['kwargs']['chat_id']
        self.chat_group_name = f'chat_{self.chat_id}'

        await self.channel_layer.group_add(self.chat_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.chat_group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        message = data['message']
        chat_session = ChatSession.objects.get(id=self.chat_id)
        sender = self.scope['user']

        chat_message = ChatMessage.objects.create(
            chat_session=chat_session,
            sender=sender,
            content=message
        )

        await self.channel_layer.group_send(
            self.chat_group_name,
            {
                'type': 'chat_message',
                'message': {
                    'id': chat_message.id,
                    'sender': UserSerializer(sender).data,
                    'content': message,
                    'timestamp': chat_message.timestamp.isoformat()
                }
            }
        )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps(event['message']))