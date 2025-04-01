import os
from django.core.asgi import get_asgi_application

# Set Django settings module FIRST
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

# Get ASGI application (this loads Django)
django_asgi_app = get_asgi_application()

# NOW import other dependencies
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
from channels.middleware import BaseMiddleware
from django.contrib.auth.models import AnonymousUser
import logging

logger = logging.getLogger(__name__)

class JWTWebsocketMiddleware(BaseMiddleware):
    """
    Custom middleware that handles JWT authentication for WebSocket connections.
    The database operations are properly wrapped in database_sync_to_async.
    """
    async def __call__(self, scope, receive, send):
        # Delay JWT imports until they're actually needed
        from rest_framework_simplejwt.authentication import JWTAuthentication
        from channels.db import database_sync_to_async

        query_string = scope.get("query_string", b"").decode("utf-8")
        query_params = dict(
            param.split("=") for param in query_string.split("&") if "=" in param
        )

        token = query_params.get("token")
        if token:
            try:
                auth = JWTAuthentication()
                validated_token = await database_sync_to_async(auth.get_validated_token)(token)
                user = await database_sync_to_async(auth.get_user)(validated_token)
                scope["user"] = user
                logger.info(f"Authenticated WebSocket connection for user: {user.id}")
            except Exception as e:
                logger.warning(f"JWT authentication failed: {str(e)}")
                scope["user"] = AnonymousUser()
        else:
            logger.warning("No token provided in WebSocket connection")
            scope["user"] = AnonymousUser()

        return await super().__call__(scope, receive, send)

# Import routing AFTER Django is fully initialized
import projects.routing

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": AllowedHostsOriginValidator(
        JWTWebsocketMiddleware(
            URLRouter(projects.routing.websocket_urlpatterns)
        )
    ),
})