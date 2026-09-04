import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class CreateSubtaskRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)


class UpdateSubtaskRequest(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=500)
    is_completed: bool | None = None


class ReorderItem(BaseModel):
    id: uuid.UUID
    position: int


class ReorderSubtasksRequest(BaseModel):
    items: list[ReorderItem]


class SubtaskResponse(BaseModel):
    id: uuid.UUID
    task_id: uuid.UUID
    title: str
    is_completed: bool
    position: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
