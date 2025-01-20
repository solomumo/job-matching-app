from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from notifications.models import Notification

class NotificationConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        if self.scope["user"].is_anonymous:
            await self.close()
        else:
            await self.channel_layer.group_add(
                f"user_{self.scope['user'].id}",
                self.channel_name
            )
            await self.accept()

    async def disconnect(self, close_code):
        if not self.scope["user"].is_anonymous:
            await self.channel_layer.group_discard(
                f"user_{self.scope['user'].id}",
                self.channel_name
            )

    async def notification_message(self, event):
        """
        Handle different types of notification updates:
        - new_notification: New notification created
        - mark_read: Single notification marked as read
        - mark_all_read: All notifications marked as read
        """
        await self.send_json(event["data"]) 