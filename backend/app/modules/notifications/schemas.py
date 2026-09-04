import uuid
from datetime import datetime

from pydantic import BaseModel

from app.modules.notifications.models import NotificationType


class NotificationResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    type: NotificationType
    title: str
    message: str
    link: str
    is_read: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class UnreadCountResponse(BaseModel):
    count: int
