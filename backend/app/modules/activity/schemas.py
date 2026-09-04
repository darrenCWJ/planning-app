import uuid
from datetime import datetime

from pydantic import BaseModel

from app.modules.activity.models import ActivityAction, ActivityEntityType


class ActivityResponse(BaseModel):
    id: uuid.UUID
    workspace_id: uuid.UUID
    project_id: uuid.UUID | None
    task_id: uuid.UUID | None
    actor_id: uuid.UUID
    action: ActivityAction
    entity_type: ActivityEntityType
    entity_id: uuid.UUID
    details: dict | None
    created_at: datetime
    actor_name: str | None = None

    model_config = {"from_attributes": True}
