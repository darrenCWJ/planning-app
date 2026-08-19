from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class CreateProjectRequest(BaseModel):
    name: str
    key: str
    description: str = ""


class UpdateProjectRequest(BaseModel):
    name: str | None = None
    description: str | None = None


class ColumnResponse(BaseModel):
    id: UUID
    name: str
    position: str

    model_config = {"from_attributes": True}


class ProjectResponse(BaseModel):
    id: UUID
    workspace_id: UUID
    name: str
    key: str
    description: str
    is_archived: bool
    created_at: datetime
    columns: list[ColumnResponse] = []

    model_config = {"from_attributes": True}
