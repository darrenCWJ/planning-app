from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user_id
from app.core.responses import envelope
from app.modules.dependencies.schemas import AddDependencyRequest
from app.modules.dependencies.service import (
    add_dependency,
    list_dependencies,
    remove_dependency,
)

router = APIRouter(tags=["dependencies"])


@router.post("/api/tasks/{task_id}/dependencies", status_code=status.HTTP_201_CREATED)
async def add(
    task_id: UUID,
    data: AddDependencyRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    dep = await add_dependency(db, task_id, data.blocked_by_task_id)
    return envelope({
        "id": str(dep.id),
        "task_id": str(dep.task_id),
        "blocked_by_task_id": str(dep.blocked_by_task_id),
        "created_at": dep.created_at.isoformat(),
    })


@router.get("/api/tasks/{task_id}/dependencies")
async def list_all(
    task_id: UUID,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    deps = await list_dependencies(db, task_id)
    return envelope(deps)


@router.delete("/api/dependencies/{dependency_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove(
    dependency_id: UUID,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    removed = await remove_dependency(db, dependency_id)
    if not removed:
        raise HTTPException(status_code=404, detail="Dependency not found")
