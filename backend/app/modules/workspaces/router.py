from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user_id
from app.core.responses import envelope
from app.modules.workspaces.exceptions import MemberAlreadyExistsError, UserNotFoundError
from app.modules.workspaces.schemas import (
    CreateWorkspaceRequest,
    InviteMemberRequest,
    WorkspaceMemberResponse,
    WorkspaceResponse,
)
from app.modules.workspaces.service import (
    create_workspace,
    get_workspace,
    invite_member,
    list_members,
    list_user_workspaces,
)

router = APIRouter(prefix="/api/workspaces", tags=["workspaces"])


@router.post("", status_code=status.HTTP_201_CREATED)
async def create(
    data: CreateWorkspaceRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    workspace = await create_workspace(db, data.name, data.slug, UUID(user_id))
    return envelope(WorkspaceResponse.model_validate(workspace).model_dump())


@router.get("")
async def list_workspaces(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    workspaces = await list_user_workspaces(db, UUID(user_id))
    return envelope([WorkspaceResponse.model_validate(w).model_dump() for w in workspaces])


@router.get("/{workspace_id}")
async def get_workspace_detail(
    workspace_id: UUID,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    workspace = await get_workspace(db, workspace_id)
    if not workspace:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found")
    return envelope(WorkspaceResponse.model_validate(workspace).model_dump())


@router.post("/{workspace_id}/members", status_code=status.HTTP_201_CREATED)
async def invite(
    workspace_id: UUID,
    data: InviteMemberRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    try:
        member = await invite_member(db, workspace_id, data.email, data.role)
    except UserNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except MemberAlreadyExistsError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    return envelope(WorkspaceMemberResponse.model_validate(member).model_dump())


@router.get("/{workspace_id}/members")
async def get_members(
    workspace_id: UUID,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    members = await list_members(db, workspace_id)
    return envelope(members)
