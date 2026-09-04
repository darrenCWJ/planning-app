import uuid
from datetime import datetime

from pydantic import BaseModel


class StartTimerRequest(BaseModel):
    description: str = ""


class LogTimeRequest(BaseModel):
    description: str = ""
    duration_seconds: int
    started_at: datetime


class TimeEntryResponse(BaseModel):
    id: uuid.UUID
    task_id: uuid.UUID
    user_id: uuid.UUID
    description: str
    started_at: datetime
    ended_at: datetime | None
    duration_seconds: int
    created_at: datetime

    model_config = {"from_attributes": True}
