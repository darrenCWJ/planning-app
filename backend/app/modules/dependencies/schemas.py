import uuid
from datetime import datetime

from pydantic import BaseModel


class AddDependencyRequest(BaseModel):
    blocked_by_task_id: uuid.UUID


class TaskDependencyResponse(BaseModel):
    id: uuid.UUID
    task_id: uuid.UUID
    blocked_by_task_id: uuid.UUID
    blocked_by_title: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
