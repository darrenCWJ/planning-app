from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.modules.projects.models import Project, WorkflowColumn
from app.modules.tasks.models import Task

DEFAULT_COLUMNS = [
    ("To Do", "a"),
    ("In Progress", "b"),
    ("Done", "c"),
]


async def create_project(
    db: AsyncSession, workspace_id: UUID, name: str, key: str, description: str
) -> Project:
    project = Project(workspace_id=workspace_id, name=name, key=key, description=description)
    db.add(project)
    await db.flush()

    for col_name, position in DEFAULT_COLUMNS:
        column = WorkflowColumn(project_id=project.id, name=col_name, position=position)
        db.add(column)

    await db.commit()

    result = await db.execute(
        select(Project).options(selectinload(Project.columns)).where(Project.id == project.id)
    )
    return result.scalar_one()


async def list_projects(db: AsyncSession, workspace_id: UUID) -> list[Project]:
    result = await db.execute(
        select(Project)
        .options(selectinload(Project.columns))
        .where(Project.workspace_id == workspace_id, Project.is_archived == False)  # noqa: E712
    )
    return list(result.scalars().all())


async def get_project(db: AsyncSession, project_id: UUID) -> Project | None:
    result = await db.execute(
        select(Project).options(selectinload(Project.columns)).where(Project.id == project_id)
    )
    return result.scalar_one_or_none()


async def update_project(
    db: AsyncSession, project_id: UUID, name: str | None, description: str | None
) -> Project | None:
    project = await get_project(db, project_id)
    if not project:
        return None
    if name is not None:
        project.name = name
    if description is not None:
        project.description = description
    await db.commit()
    await db.refresh(project)
    return project


async def create_column(db: AsyncSession, project_id: UUID, name: str) -> WorkflowColumn:
    result = await db.execute(
        select(func.count()).select_from(WorkflowColumn).where(WorkflowColumn.project_id == project_id)
    )
    count = result.scalar_one()
    position = chr(ord("a") + count)

    column = WorkflowColumn(project_id=project_id, name=name, position=position)
    db.add(column)
    await db.commit()
    await db.refresh(column)
    return column


async def get_column(db: AsyncSession, column_id: UUID) -> WorkflowColumn | None:
    result = await db.execute(select(WorkflowColumn).where(WorkflowColumn.id == column_id))
    return result.scalar_one_or_none()


async def update_column(db: AsyncSession, column_id: UUID, name: str | None) -> WorkflowColumn | None:
    column = await get_column(db, column_id)
    if not column:
        return None
    if name is not None:
        column.name = name
    await db.commit()
    await db.refresh(column)
    return column


async def reorder_columns(db: AsyncSession, project_id: UUID, column_ids: list[UUID]) -> list[WorkflowColumn]:
    for idx, col_id in enumerate(column_ids):
        result = await db.execute(
            select(WorkflowColumn).where(WorkflowColumn.id == col_id, WorkflowColumn.project_id == project_id)
        )
        column = result.scalar_one_or_none()
        if column:
            column.position = chr(ord("a") + idx)

    await db.commit()

    result = await db.execute(
        select(WorkflowColumn)
        .where(WorkflowColumn.project_id == project_id)
        .order_by(WorkflowColumn.position)
    )
    return list(result.scalars().all())


async def delete_column(db: AsyncSession, column_id: UUID) -> bool:
    column = await get_column(db, column_id)
    if not column:
        return False

    task_count_result = await db.execute(
        select(func.count()).select_from(Task).where(
            Task.column_id == column_id, Task.is_archived == False  # noqa: E712
        )
    )
    task_count = task_count_result.scalar_one()
    if task_count > 0:
        raise ValueError(f"Cannot delete column with {task_count} active tasks")

    await db.delete(column)
    await db.commit()
    return True
