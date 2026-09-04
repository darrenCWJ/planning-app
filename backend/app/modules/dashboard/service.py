import uuid
from datetime import date, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.projects.models import Project
from app.modules.tasks.models import Task
from app.modules.workspaces.models import WorkspaceMember


async def get_dashboard(db: AsyncSession, user_id: uuid.UUID) -> dict:
    user_workspaces = select(WorkspaceMember.workspace_id).where(
        WorkspaceMember.user_id == user_id
    )

    base = (
        select(Task, Project.name.label("project_name"), Project.key.label("project_key"))
        .join(Project, Task.project_id == Project.id)
        .where(Project.workspace_id.in_(user_workspaces))
        .where(Task.assignee_id == user_id)
        .where(Task.is_archived == False)  # noqa: E712
    )

    today = date.today()
    week_end = today + timedelta(days=7)

    assigned_result = await db.execute(base.order_by(Task.due_date.asc().nulls_last()))
    overdue_result = await db.execute(
        base.where(Task.due_date < today).order_by(Task.due_date.asc())
    )
    due_week_result = await db.execute(
        base.where(Task.due_date >= today, Task.due_date <= week_end)
        .order_by(Task.due_date.asc())
    )

    def serialize_rows(rows):
        return [
            {
                "id": str(task.id),
                "title": task.title,
                "priority": task.priority.value if task.priority else None,
                "due_date": task.due_date.isoformat() if task.due_date else None,
                "project_name": pname,
                "project_key": pkey,
                "project_id": str(task.project_id),
                "column_id": str(task.column_id),
            }
            for task, pname, pkey in rows
        ]

    return {
        "assigned_tasks": serialize_rows(assigned_result.all()),
        "overdue_tasks": serialize_rows(overdue_result.all()),
        "due_this_week": serialize_rows(due_week_result.all()),
    }
