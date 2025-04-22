from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from rest_framework_simplejwt.tokens import AccessToken
from api.models import CustomUser
from projects.models import ChatSession, ChatMessage, Notification, VideoCall
from skills.models import Mentorship
from api.serializers import UserSerializer
from django.contrib.auth import get_user_model
import json
import logging
import base64
from django.core.files.base import ContentFile
from django.conf import settings
import uuid

logger = logging.getLogger(__name__)

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.chat_id = self.scope['url_route']['kwargs']['chat_id']
        self.chat_group_name = f'chat_{self.chat_id}'
        user = self.scope['user']

        if user.is_anonymous:
            logger.warning("Anonymous user rejected")
            await self.close(code=4001, reason="Authentication required")
            return

        try:
            # Try ChatSession (integer ID)
            try:
                self.chat_session = await database_sync_to_async(ChatSession.objects.get)(id=int(self.chat_id), is_active=True)
                helper_id = await database_sync_to_async(lambda: self.chat_session.helper.id)()
                requester_id = await database_sync_to_async(lambda: self.chat_session.requester.id)()
                if user.id not in [helper_id, requester_id]:
                    logger.warning(f"Unauthorized user {user.id} ({user.username}) attempted to join chat {self.chat_id}")
                    await self.close(code=4003, reason="Unauthorized access")
                    return
                self.is_mentorship = False
            except (ChatSession.DoesNotExist, ValueError):
                # Try Mentorship (UUID)
                try:
                    mentorship = await database_sync_to_async(Mentorship.objects.get)(chat_session_id=self.chat_id, status='active')
                    learner_id = await database_sync_to_async(lambda: mentorship.learner.id)()
                    mentor_id = await database_sync_to_async(lambda: mentorship.mentor.id)()
                    if user.id not in [learner_id, mentor_id]:
                        logger.warning(f"Unauthorized user {user.id} ({user.username}) attempted to join mentorship chat {self.chat_id}")
                        await self.close(code=4003, reason="Unauthorized access")
                        return
                    self.chat_session = None
                    self.is_mentorship = True
                except Mentorship.DoesNotExist:
                    logger.error(f"Chat session or mentorship {self.chat_id} not found")
                    await self.close(code=4000, reason="Chat session or mentorship not found")
                    return

            await self.channel_layer.group_add(self.chat_group_name, self.channel_name)
            await self.accept()
            await self.send(text_data=json.dumps({"message": "Connected to chat"}))
            messages = await self.get_chat_history()
            for msg in messages:
                await self.send(text_data=json.dumps(msg))
        except Exception as e:
            logger.error(f"Connect error: {str(e)}")
            await self.close(code=1011, reason="Server error")

    @database_sync_to_async
    def get_chat_history(self):
        if self.is_mentorship:
            messages = ChatMessage.objects.filter(mentorship_chat_session_id=self.chat_id).order_by('timestamp')
        else:
            messages = ChatMessage.objects.filter(chat_session=self.chat_session).order_by('timestamp')
        return [{
            'id': msg.id,
            'sender': UserSerializer(msg.sender).data,
            'content': msg.content,
            'image_url': msg.image.url if msg.image else None,
            'timestamp': msg.timestamp.isoformat()
        } for msg in messages]

    async def disconnect(self, close_code):
        logger.info(f"Disconnected from {self.chat_group_name}, code: {close_code}")
        await self.channel_layer.group_discard(self.chat_group_name, self.channel_name)

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            logger.info(f"Received data: {data}")
            message = data.get('message', '')
            image_base64 = data.get('image', '')
            sender = self.scope['user']

            if not message and not image_base64:
                logger.warning("Empty message received")
                return

            message_data = None

            if message:
                logger.info("Processing text message")
                chat_message = await database_sync_to_async(ChatMessage.objects.create)(
                    chat_session=self.chat_session if not self.is_mentorship else None,
                    mentorship_chat_session_id=self.chat_id if self.is_mentorship else None,
                    sender=sender,
                    content=message
                )
                logger.info(f"Created text chat_message with ID: {chat_message.id}")
                message_data = {
                    'id': chat_message.id,
                    'sender': UserSerializer(sender).data,
                    'content': message,
                    'timestamp': chat_message.timestamp.isoformat()
                }

            elif image_base64:
                logger.info("Processing image message")
                chat_message = await database_sync_to_async(ChatMessage.objects.create)(
                    chat_session=self.chat_session if not self.is_mentorship else None,
                    mentorship_chat_session_id=self.chat_id if self.is_mentorship else None,
                    sender=sender
                )
                logger.info(f"Created image chat_message with ID: {chat_message.id}")
                try:
                    image_data = base64.b64decode(image_base64)
                    image_file = ContentFile(image_data, name=f'chat_{self.chat_id}_{sender.id}_{chat_message.id}.jpg')
                    chat_message.image = image_file
                    await database_sync_to_async(chat_message.save)()
                    image_url = chat_message.image.url
                    logger.info(f"Image saved at: {image_url}")
                except base64.binascii.Error as e:
                    logger.error(f"Invalid base64 image data: {str(e)}")
                    await database_sync_to_async(chat_message.delete)()
                    return

                message_data = {
                    'id': chat_message.id,
                    'sender': UserSerializer(sender).data,
                    'image_url': image_url,
                    'timestamp': chat_message.timestamp.isoformat()
                }

            if message_data:
                logger.info(f"Sending message_data: {message_data}")
                await self.channel_layer.group_send(
                    self.chat_group_name,
                    {
                        'type': 'chat_message',
                        'message': message_data,
                        'sender_channel': self.channel_name
                    }
                )
                await self.send(text_data=json.dumps(message_data))
            else:
                logger.error("No message_data created; skipping send")

        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON data: {str(e)}")
            await self.send(text_data=json.dumps({"error": "Invalid message format"}))
        except Exception as e:
            logger.error(f"Receive error: {str(e)}")
            await self.close(code=1011, reason="Server error")

    async def chat_message(self, event):
        message_data = event['message']
        sender_channel = event.get('sender_channel')
        if self.channel_name != sender_channel:
            logger.info(f"Broadcasting to {self.channel_name}: {message_data}")
            await self.send(text_data=json.dumps(message_data))

    async def chat_ended(self, event):
        await self.send(text_data=json.dumps({
            'type': 'chat_ended',
            'message': event['message']
        }))
        await self.close(code=1000, reason="Chat ended by other participant")

class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        query_string = self.scope['query_string'].decode()
        token = dict(qc.split('=') for qc in query_string.split('&')).get('token', '')
        try:
            access_token = AccessToken(token)
            user_id = access_token['user_id']
            self.user = await database_sync_to_async(CustomUser.objects.get)(id=user_id)
            self.group_name = f'notifications_{user_id}'
            await self.channel_layer.group_add('notifications', self.channel_name)
            await self.channel_layer.group_add(self.group_name, self.channel_name)
            await self.accept()
            logger.info(f"NotificationConsumer connected for user {self.user.username}")

            notifications = await self.get_notifications()
            for notification in notifications:
                await self.send(text_data=json.dumps({
                    'type': 'notification',
                    'notification': {
                        'id': notification['id'],
                        'message': notification['message'],
                        'is_read': notification['is_read'],
                        'created_at': notification['created_at'].isoformat(),
                        'notification_type': notification['notification_type'],
                        'link': notification['link'] or None
                    }
                }))
        except Exception as e:
            logger.error(f"NotificationConsumer connection failed: {str(e)}")
            await self.close(code=4001, reason="Authentication failed")

    async def disconnect(self, close_code):
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard('notifications', self.channel_name)
            await self.channel_layer.group_discard(self.group_name, self.channel_name)
            logger.info(f"NotificationConsumer disconnected for user {self.user.username}, code: {close_code}")

    async def notification(self, event):
        try:
            notification = event['notification']
            if not all(key in notification for key in ['id', 'message', 'is_read', 'created_at', 'notification_type']):
                logger.error("Missing fields in notification data")
                return
            await self.send(text_data=json.dumps({
                'type': 'notification',
                'notification': notification
            }))
            logger.info(f"Sent notification to user {self.user.username}: {notification['message']}")
        except Exception as e:
            logger.error(f"Error sending notification: {str(e)}")
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Error processing notification'
            }))

    @database_sync_to_async
    def get_notifications(self):
        return list(Notification.objects.filter(user=self.user).values(
            'id', 'message', 'is_read', 'created_at', 'notification_type', 'link'
        ))

class VideoCallConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        token = self.scope['query_string'].decode().split('token=')[1] if 'token=' in self.scope['query_string'].decode() else None
        if not token or not await self.get_user_from_token(token):
            await self.close(code=4001, reason="Invalid token")
            return

        self.call_id = self.scope['url_route']['kwargs']['call_id']
        self.group_name = f"video_call_{self.call_id}"

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
        logger.info(f"Connected to video call {self.call_id}: {self.channel_name}")

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)
        logger.info(f"Disconnected from video call {self.call_id}: {self.channel_name}")

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            if message_type in ['offer', 'answer', 'candidate', 'track_status']:
                await self.channel_layer.group_send(
                    self.group_name,
                    {'type': 'video_message', 'message': data}
                )
        except json.JSONDecodeError as e:
            logger.error(f"Invalid video call data: {str(e)}")

    async def video_message(self, event):
        await self.send(text_data=json.dumps(event['message']))

    async def call_ended(self, event):
        await self.send(text_data=json.dumps(event['message']))

    @database_sync_to_async
    def get_user_from_token(self, token):
        try:
            access_token = AccessToken(token)
            return get_user_model().objects.get(id=access_token['user_id'])
        except Exception:
            return None