from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user_id
from app.core.responses import envelope
from app.modules.sprints.schemas import CreateSprintRequest, UpdateSprintRequest
from app.modules.sprints.service import create_sprint, delete_sprint, list_sprints, update_sprint

router = APIRouter(tags=["sprints"])


@router.post("/api/projects/{project_id}/sprints", status_code=status.HTTP_201_CREATED)
async def create(
    project_id: UUID,
    data: CreateSprintRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    sprint = await create_sprint(db, project_id, data.name, data.start_date, data.end_date)
    return envelope({
        "id": str(sprint.id), "project_id": str(sprint.project_id),
        "name": sprint.name, "start_date": sprint.start_date.isoformat(),
        "end_date": sprint.end_date.isoformat(), "is_active": sprint.is_active,
        "created_at": sprint.created_at.isoformat(), "task_count": 0, "completed_count": 0,
    })


@router.get("/api/projects/{project_id}/sprints")
async def list_all(
    project_id: UUID,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    return envelope(await list_sprints(db, project_id))


@router.patch("/api/sprints/{sprint_id}")
async def update(
    sprint_id: UUID,
    data: UpdateSprintRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    sprint = await update_sprint(db, sprint_id, **data.model_dump(exclude_unset=True))
    if not sprint:
        raise HTTPException(status_code=404, detail="Sprint not found")
    return envelope({
        "id": str(sprint.id), "project_id": str(sprint.project_id),
        "name": sprint.name, "start_date": sprint.start_date.isoformat(),
        "end_date": sprint.end_date.isoformat(), "is_active": sprint.is_active,
        "created_at": sprint.created_at.isoformat(),
    })


@router.delete("/api/sprints/{sprint_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete(
    sprint_id: UUID,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    if not await delete_sprint(db, sprint_id):
        raise HTTPException(status_code=404, detail="Sprint not found")
