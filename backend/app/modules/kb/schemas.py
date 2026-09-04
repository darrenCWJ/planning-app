import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class CreateKBPageRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    content: str = ""
    parent_id: uuid.UUID | None = None


class UpdateKBPageRequest(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=500)
    content: str | None = None
    parent_id: uuid.UUID | None = None
    position: int | None = None


class KBPageResponse(BaseModel):
    id: uuid.UUID
    workspace_id: uuid.UUID
    parent_id: uuid.UUID | None
    title: str
    slug: str
    content: str
    created_by: uuid.UUID
    updated_by: uuid.UUID
    updated_by_name: str | None = None
    position: int
    is_archived: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class KBPageTreeItem(BaseModel):
    id: uuid.UUID
    title: str
    slug: str
    parent_id: uuid.UUID | None
    position: int
    children: list["KBPageTreeItem"] = []

    model_config = {"from_attributes": True}
