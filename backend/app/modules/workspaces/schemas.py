from datetime import datetime
from uuid import UUID

from pydantic import BaseModel

from app.modules.workspaces.models import WorkspaceRole


class CreateWorkspaceRequest(BaseModel):
    name: str
    slug: str


class InviteMemberRequest(BaseModel):
    email: str
    role: WorkspaceRole = WorkspaceRole.MEMBER


class WorkspaceResponse(BaseModel):
    id: UUID
    name: str
    slug: str
    created_by: UUID
    created_at: datetime

    model_config = {"from_attributes": True}


class WorkspaceMemberResponse(BaseModel):
    id: UUID
    user_id: UUID
    role: WorkspaceRole
    joined_at: datetime

    model_config = {"from_attributes": True}
