from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.projects.models import WorkflowColumn
from app.modules.tasks.models import Comment, Task, TaskPriority


async def create_task(
    db: AsyncSession,
    project_id: UUID,
    title: str,
    description: str,
    priority: TaskPriority,
    assignee_id: UUID | None,
    due_date=None,
) -> Task:
    first_col = await db.execute(
        select(WorkflowColumn)
        .where(WorkflowColumn.project_id == project_id)
        .order_by(WorkflowColumn.position)
        .limit(1)
    )
    column = first_col.scalar_one()

    task = Task(
        project_id=project_id,
        column_id=column.id,
        title=title,
        description=description,
        priority=priority,
        assignee_id=assignee_id,
        due_date=due_date,
        position="a",
    )
    db.add(task)
    await db.commit()
    await db.refresh(task)
    return task


async def get_task(db: AsyncSession, task_id: UUID) -> Task | None:
    result = await db.execute(select(Task).where(Task.id == task_id))
    return result.scalar_one_or_none()


async def update_task(db: AsyncSession, task_id: UUID, **fields) -> Task | None:
    task = await get_task(db, task_id)
    if not task:
        return None
    for key, value in fields.items():
        if value is not None:
            setattr(task, key, value)
    await db.commit()
    await db.refresh(task)
    return task


async def move_task(db: AsyncSession, task_id: UUID, column_id: UUID, position: str) -> Task | None:
    task = await get_task(db, task_id)
    if not task:
        return None
    task.column_id = column_id
    task.position = position
    await db.commit()
    await db.refresh(task)
    return task


async def list_tasks(
    db: AsyncSession, project_id: UUID, priority: str | None = None, search: str | None = None
) -> list[Task]:
    query = select(Task).where(Task.project_id == project_id, Task.is_archived == False)  # noqa: E712
    if priority:
        query = query.where(Task.priority == priority)
    if search:
        query = query.where(Task.title.ilike(f"%{search}%"))
    query = query.order_by(Task.created_at.desc())
    result = await db.execute(query)
    return list(result.scalars().all())


async def get_board(db: AsyncSession, project_id: UUID) -> dict:
    columns_result = await db.execute(
        select(WorkflowColumn)
        .where(WorkflowColumn.project_id == project_id)
        .order_by(WorkflowColumn.position)
    )
    columns = list(columns_result.scalars().all())

    tasks_result = await db.execute(
        select(Task)
        .where(Task.project_id == project_id, Task.is_archived == False)  # noqa: E712
        .order_by(Task.position)
    )
    tasks = list(tasks_result.scalars().all())

    tasks_by_column: dict[UUID, list[Task]] = {col.id: [] for col in columns}
    for task in tasks:
        if task.column_id in tasks_by_column:
            tasks_by_column[task.column_id].append(task)

    return {
        "project_id": project_id,
        "columns": [
            {
                "id": col.id,
                "name": col.name,
                "position": col.position,
                "tasks": tasks_by_column[col.id],
            }
            for col in columns
        ],
    }


async def add_comment(
    db: AsyncSession, task_id: UUID, author_id: UUID, content: str
) -> Comment:
    comment = Comment(task_id=task_id, author_id=author_id, content=content)
    db.add(comment)
    await db.commit()
    await db.refresh(comment)
    return comment


async def list_comments(db: AsyncSession, task_id: UUID) -> list[Comment]:
    result = await db.execute(
        select(Comment).where(Comment.task_id == task_id).order_by(Comment.created_at)
    )
    return list(result.scalars().all())
