from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user_id
from app.core.responses import envelope
from app.modules.subtasks.schemas import (
    CreateSubtaskRequest,
    ReorderSubtasksRequest,
    SubtaskResponse,
    UpdateSubtaskRequest,
)
from app.modules.subtasks.service import (
    create_subtask,
    delete_subtask,
    list_subtasks,
    reorder_subtasks,
    update_subtask,
)

router = APIRouter(tags=["subtasks"])


@router.post("/api/tasks/{task_id}/subtasks", status_code=status.HTTP_201_CREATED)
async def create(
    task_id: UUID,
    data: CreateSubtaskRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    subtask = await create_subtask(db, task_id, data.title)
    return envelope(SubtaskResponse.model_validate(subtask).model_dump())


@router.get("/api/tasks/{task_id}/subtasks")
async def list_all(
    task_id: UUID,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    subtasks = await list_subtasks(db, task_id)
    return envelope([SubtaskResponse.model_validate(s).model_dump() for s in subtasks])


@router.patch("/api/subtasks/{subtask_id}")
async def update(
    subtask_id: UUID,
    data: UpdateSubtaskRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    subtask = await update_subtask(db, subtask_id, data.title, data.is_completed)
    if not subtask:
        raise HTTPException(status_code=404, detail="Subtask not found")
    return envelope(SubtaskResponse.model_validate(subtask).model_dump())


@router.put("/api/tasks/{task_id}/subtasks/reorder")
async def reorder(
    task_id: UUID,
    data: ReorderSubtasksRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    items = [{"id": i.id, "position": i.position} for i in data.items]
    subtasks = await reorder_subtasks(db, task_id, items)
    return envelope([SubtaskResponse.model_validate(s).model_dump() for s in subtasks])


@router.delete("/api/subtasks/{subtask_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete(
    subtask_id: UUID,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    deleted = await delete_subtask(db, subtask_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Subtask not found")
