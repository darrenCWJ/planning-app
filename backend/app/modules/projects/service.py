from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.modules.projects.models import Project, WorkflowColumn

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
