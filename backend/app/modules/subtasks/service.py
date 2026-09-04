import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.subtasks.models import Subtask


async def create_subtask(db: AsyncSession, task_id: uuid.UUID, title: str) -> Subtask:
    max_pos = await db.scalar(
        select(Subtask.position)
        .where(Subtask.task_id == task_id)
        .order_by(Subtask.position.desc())
        .limit(1)
    )
    subtask = Subtask(
        task_id=task_id,
        title=title,
        position=(max_pos or 0) + 1,
    )
    db.add(subtask)
    await db.commit()
    await db.refresh(subtask)
    return subtask


async def list_subtasks(db: AsyncSession, task_id: uuid.UUID) -> list[Subtask]:
    result = await db.execute(
        select(Subtask).where(Subtask.task_id == task_id).order_by(Subtask.position)
    )
    return list(result.scalars().all())


async def update_subtask(
    db: AsyncSession,
    subtask_id: uuid.UUID,
    title: str | None = None,
    is_completed: bool | None = None,
) -> Subtask | None:
    subtask = await db.get(Subtask, subtask_id)
    if not subtask:
        return None
    if title is not None:
        subtask.title = title
    if is_completed is not None:
        subtask.is_completed = is_completed
    await db.commit()
    await db.refresh(subtask)
    return subtask


async def reorder_subtasks(
    db: AsyncSession, task_id: uuid.UUID, items: list[dict]
) -> list[Subtask]:
    for item in items:
        subtask = await db.get(Subtask, item["id"])
        if subtask and subtask.task_id == task_id:
            subtask.position = item["position"]
    await db.commit()
    return await list_subtasks(db, task_id)


async def delete_subtask(db: AsyncSession, subtask_id: uuid.UUID) -> bool:
    subtask = await db.get(Subtask, subtask_id)
    if not subtask:
        return False
    await db.delete(subtask)
    await db.commit()
    return True
