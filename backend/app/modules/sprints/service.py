import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.sprints.models import Sprint
from app.modules.tasks.models import Task


async def create_sprint(
    db: AsyncSession, project_id: uuid.UUID, name: str, start_date, end_date
) -> Sprint:
    sprint = Sprint(
        project_id=project_id, name=name, start_date=start_date, end_date=end_date
    )
    db.add(sprint)
    await db.commit()
    await db.refresh(sprint)
    return sprint


async def list_sprints(db: AsyncSession, project_id: uuid.UUID) -> list[dict]:
    result = await db.execute(
        select(Sprint).where(Sprint.project_id == project_id).order_by(Sprint.start_date.desc())
    )
    sprints = list(result.scalars().all())
    sprint_data = []
    for s in sprints:
        task_count = await db.scalar(
            select(func.count(Task.id))
            .where(Task.project_id == project_id, Task.due_date >= s.start_date, Task.due_date <= s.end_date)
        ) or 0
        completed_count = await db.scalar(
            select(func.count(Task.id))
            .where(Task.project_id == project_id, Task.due_date >= s.start_date, Task.due_date <= s.end_date, Task.is_archived == True)  # noqa: E712
        ) or 0
        sprint_data.append({
            "id": str(s.id), "project_id": str(s.project_id), "name": s.name,
            "start_date": s.start_date.isoformat(), "end_date": s.end_date.isoformat(),
            "is_active": s.is_active, "created_at": s.created_at.isoformat(),
            "task_count": task_count, "completed_count": completed_count,
        })
    return sprint_data


async def update_sprint(db: AsyncSession, sprint_id: uuid.UUID, **kwargs) -> Sprint | None:
    sprint = await db.get(Sprint, sprint_id)
    if not sprint:
        return None
    for key, value in kwargs.items():
        if value is not None:
            setattr(sprint, key, value)
    await db.commit()
    await db.refresh(sprint)
    return sprint


async def delete_sprint(db: AsyncSession, sprint_id: uuid.UUID) -> bool:
    sprint = await db.get(Sprint, sprint_id)
    if not sprint:
        return False
    await db.delete(sprint)
    await db.commit()
    return True
