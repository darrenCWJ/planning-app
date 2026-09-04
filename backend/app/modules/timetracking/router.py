from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user_id
from app.core.responses import envelope
from app.modules.timetracking.schemas import (
    LogTimeRequest,
    StartTimerRequest,
    TimeEntryResponse,
)
from app.modules.timetracking.service import (
    delete_time_entry,
    get_task_total,
    list_time_entries,
    log_time,
    start_timer,
    stop_timer,
)

router = APIRouter(tags=["timetracking"])


@router.post("/api/tasks/{task_id}/time/start", status_code=status.HTTP_201_CREATED)
async def start(
    task_id: UUID,
    data: StartTimerRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    entry = await start_timer(db, task_id, UUID(user_id), data.description)
    return envelope(TimeEntryResponse.model_validate(entry).model_dump())


@router.post("/api/time/{entry_id}/stop")
async def stop(
    entry_id: UUID,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    entry = await stop_timer(db, entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Timer not found or already stopped")
    return envelope(TimeEntryResponse.model_validate(entry).model_dump())


@router.post("/api/tasks/{task_id}/time/log", status_code=status.HTTP_201_CREATED)
async def log(
    task_id: UUID,
    data: LogTimeRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    entry = await log_time(
        db, task_id, UUID(user_id), data.duration_seconds, data.started_at, data.description
    )
    return envelope(TimeEntryResponse.model_validate(entry).model_dump())


@router.get("/api/tasks/{task_id}/time")
async def list_entries(
    task_id: UUID,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    entries = await list_time_entries(db, task_id)
    return envelope([TimeEntryResponse.model_validate(e).model_dump() for e in entries])


@router.get("/api/tasks/{task_id}/time/total")
async def total(
    task_id: UUID,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    total_secs = await get_task_total(db, task_id)
    return envelope({"task_id": str(task_id), "total_seconds": total_secs})


@router.delete("/api/time/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete(
    entry_id: UUID,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    deleted = await delete_time_entry(db, entry_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Time entry not found")
