import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class CreateWebhookRequest(BaseModel):
    url: str = Field(..., min_length=1, max_length=1000)
    events: list[str] = Field(default_factory=lambda: ["task.created", "task.updated", "task.moved", "task.archived"])
    secret: str = ""


class UpdateWebhookRequest(BaseModel):
    url: str | None = Field(None, min_length=1, max_length=1000)
    events: list[str] | None = None
    is_active: bool | None = None


class WebhookResponse(BaseModel):
    id: uuid.UUID
    workspace_id: uuid.UUID
    url: str
    events: list[str]
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
