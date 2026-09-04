import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.dependencies.models import TaskDependency
from app.modules.tasks.models import Task


async def add_dependency(
    db: AsyncSession, task_id: uuid.UUID, blocked_by_task_id: uuid.UUID
) -> TaskDependency:
    dep = TaskDependency(task_id=task_id, blocked_by_task_id=blocked_by_task_id)
    db.add(dep)
    await db.commit()
    await db.refresh(dep)
    return dep


async def list_dependencies(db: AsyncSession, task_id: uuid.UUID) -> list[dict]:
    stmt = (
        select(TaskDependency, Task.title)
        .join(Task, TaskDependency.blocked_by_task_id == Task.id)
        .where(TaskDependency.task_id == task_id)
        .order_by(TaskDependency.created_at)
    )
    result = await db.execute(stmt)
    return [
        {
            "id": str(dep.id),
            "task_id": str(dep.task_id),
            "blocked_by_task_id": str(dep.blocked_by_task_id),
            "blocked_by_title": title,
            "created_at": dep.created_at.isoformat(),
        }
        for dep, title in result.all()
    ]


async def remove_dependency(db: AsyncSession, dependency_id: uuid.UUID) -> bool:
    dep = await db.get(TaskDependency, dependency_id)
    if not dep:
        return False
    await db.delete(dep)
    await db.commit()
    return True
