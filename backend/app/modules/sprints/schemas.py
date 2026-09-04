import uuid
from datetime import date, datetime

from pydantic import BaseModel, Field


class CreateSprintRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    start_date: date
    end_date: date


class UpdateSprintRequest(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=200)
    start_date: date | None = None
    end_date: date | None = None
    is_active: bool | None = None


class SprintResponse(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID
    name: str
    start_date: date
    end_date: date
    is_active: bool
    created_at: datetime
    task_count: int = 0
    completed_count: int = 0

    model_config = {"from_attributes": True}
