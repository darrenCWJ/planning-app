import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.projects.models import Project
from app.modules.tasks.models import Task


async def search_tasks(
    db: AsyncSession,
    workspace_id: uuid.UUID,
    query: str,
    limit: int = 20,
    offset: int = 0,
) -> dict:
    ts_query = func.plainto_tsquery("english", query)
    ts_vector = func.to_tsvector(
        "english", Task.title + " " + func.coalesce(Task.description, "")
    )

    stmt = (
        select(Task, Project.name.label("project_name"), Project.key.label("project_key"))
        .join(Project, Task.project_id == Project.id)
        .where(Project.workspace_id == workspace_id)
        .where(Task.is_archived == False)  # noqa: E712
        .where(ts_vector.bool_op("@@")(ts_query))
        .order_by(func.ts_rank(ts_vector, ts_query).desc())
        .limit(limit)
        .offset(offset)
    )

    result = await db.execute(stmt)
    rows = result.all()

    projects_map: dict[str, dict] = {}
    for task, project_name, project_key in rows:
        pid = str(task.project_id)
        if pid not in projects_map:
            projects_map[pid] = {
                "project_id": pid,
                "project_name": project_name,
                "project_key": project_key,
                "tasks": [],
            }
        projects_map[pid]["tasks"].append({
            "id": str(task.id),
            "title": task.title,
            "description": task.description,
            "priority": task.priority.value if task.priority else None,
            "assignee_id": str(task.assignee_id) if task.assignee_id else None,
            "due_date": task.due_date.isoformat() if task.due_date else None,
        })

    return {"projects": list(projects_map.values())}
