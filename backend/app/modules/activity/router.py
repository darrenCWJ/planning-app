from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user_id
from app.core.responses import envelope
from app.modules.activity.service import (
    list_project_activity,
    list_task_activity,
    list_workspace_activity,
)

router = APIRouter(tags=["activity"])


@router.get("/api/tasks/{task_id}/activity")
async def task_activity(
    task_id: UUID,
    limit: int = Query(20, ge=1, le=100),
    cursor: str | None = None,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    items = await list_task_activity(db, task_id, limit, cursor)
    return envelope(items)


@router.get("/api/projects/{project_id}/activity")
async def project_activity(
    project_id: UUID,
    limit: int = Query(20, ge=1, le=100),
    cursor: str | None = None,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    items = await list_project_activity(db, project_id, limit, cursor)
    return envelope(items)


@router.get("/api/workspaces/{workspace_id}/activity")
async def workspace_activity(
    workspace_id: UUID,
    limit: int = Query(20, ge=1, le=100),
    cursor: str | None = None,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    items = await list_workspace_activity(db, workspace_id, limit, cursor)
    return envelope(items)
