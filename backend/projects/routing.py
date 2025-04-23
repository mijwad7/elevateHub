# projects/routing.py
from django.urls import re_path
from . import consumers
from channels.generic.websocket import AsyncWebsocketConsumer


class DebugConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.accept()
        await self.send(text_data="Debug: Connected")

websocket_urlpatterns = [
    re_path(r'^api/ws/debug/$', DebugConsumer.as_asgi()),
    re_path(r'^api/ws/chat/(?P<chat_id>[^/]+)/$', consumers.ChatConsumer.as_asgi()),
    re_path(r'api/ws/notifications/$', consumers.NotificationConsumer.as_asgi()),
    re_path(r'api/ws/video-call/(?P<call_id>[^/]+)/', consumers.VideoCallConsumer.as_asgi()),
]
