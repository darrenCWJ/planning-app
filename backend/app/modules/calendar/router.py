import uuid
from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user_id
from app.core.responses import envelope
from app.modules.projects.models import Project, WorkflowColumn
from app.modules.tasks.models import Task

router = APIRouter(tags=["calendar"])


@router.get("/api/workspaces/{workspace_id}/calendar")
async def calendar(
    workspace_id: uuid.UUID,
    start: date = Query(...),
    end: date = Query(...),
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(
            Task,
            Project.name.label("project_name"),
            Project.key.label("project_key"),
            WorkflowColumn.name.label("column_name"),
        )
        .join(Project, Task.project_id == Project.id)
        .join(WorkflowColumn, Task.column_id == WorkflowColumn.id)
        .where(Project.workspace_id == workspace_id)
        .where(Task.is_archived == False)  # noqa: E712
        .where(Task.due_date.isnot(None))
        .where(Task.due_date >= start)
        .where(Task.due_date <= end)
        .order_by(Task.due_date.asc())
    )

    result = await db.execute(stmt)
    rows = result.all()

    items = [
        {
            "id": str(task.id),
            "title": task.title,
            "priority": task.priority.value if task.priority else None,
            "assignee_id": str(task.assignee_id) if task.assignee_id else None,
            "due_date": task.due_date.isoformat(),
            "project_id": str(task.project_id),
            "project_name": pname,
            "project_key": pkey,
            "column_name": cname,
        }
        for task, pname, pkey, cname in rows
    ]

    return envelope(items)
