from .models import Notification
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .serializers import NotificationSerializer
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

def send_notification_update(user, notification=None, update_type='new_notification'):
    """
    Send notification updates through WebSocket
    update_type can be: 'new_notification', 'mark_read', 'mark_all_read'
    """
    try:
        channel_layer = get_channel_layer()
        if channel_layer is None:
            logger.error("Channel layer is not configured properly")
            return
        
        data = {
            'type': update_type,
        }
        
        if notification:
            data['notification'] = NotificationSerializer(notification).data
        
        if update_type in ['mark_read', 'mark_all_read']:
            # Include updated unread count
            unread_count = Notification.objects.filter(user=user, is_read=False).count()
            data['unread_count'] = unread_count

        async_to_sync(channel_layer.group_send)(
            f"user_{user.id}",
            {
                "type": "notification_message",
                "data": data
            }
        )
    except Exception as e:
        logger.error(f"Error sending notification update: {str(e)}") 