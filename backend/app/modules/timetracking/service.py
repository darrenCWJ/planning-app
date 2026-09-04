import uuid
from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.timetracking.models import TimeEntry


async def start_timer(
    db: AsyncSession, task_id: uuid.UUID, user_id: uuid.UUID, description: str = ""
) -> TimeEntry:
    entry = TimeEntry(
        task_id=task_id,
        user_id=user_id,
        description=description,
        started_at=datetime.now(timezone.utc),
    )
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    return entry


async def stop_timer(db: AsyncSession, entry_id: uuid.UUID) -> TimeEntry | None:
    entry = await db.get(TimeEntry, entry_id)
    if not entry or entry.ended_at is not None:
        return None
    now = datetime.now(timezone.utc)
    entry.ended_at = now
    entry.duration_seconds = int((now - entry.started_at).total_seconds())
    await db.commit()
    await db.refresh(entry)
    return entry


async def log_time(
    db: AsyncSession,
    task_id: uuid.UUID,
    user_id: uuid.UUID,
    duration_seconds: int,
    started_at: datetime,
    description: str = "",
) -> TimeEntry:
    entry = TimeEntry(
        task_id=task_id,
        user_id=user_id,
        description=description,
        started_at=started_at,
        ended_at=started_at,
        duration_seconds=duration_seconds,
    )
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    return entry


async def list_time_entries(db: AsyncSession, task_id: uuid.UUID) -> list[TimeEntry]:
    result = await db.execute(
        select(TimeEntry)
        .where(TimeEntry.task_id == task_id)
        .order_by(TimeEntry.started_at.desc())
    )
    return list(result.scalars().all())


async def get_task_total(db: AsyncSession, task_id: uuid.UUID) -> int:
    result = await db.scalar(
        select(func.coalesce(func.sum(TimeEntry.duration_seconds), 0))
        .where(TimeEntry.task_id == task_id)
    )
    return result or 0


async def delete_time_entry(db: AsyncSession, entry_id: uuid.UUID) -> bool:
    entry = await db.get(TimeEntry, entry_id)
    if not entry:
        return False
    await db.delete(entry)
    await db.commit()
    return True
