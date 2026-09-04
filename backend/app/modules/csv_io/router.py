import csv
import io
import uuid

from fastapi import APIRouter, Depends, File, UploadFile
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user_id
from app.core.responses import envelope
from app.modules.projects.models import WorkflowColumn
from app.modules.tasks.models import Task, TaskPriority

router = APIRouter(tags=["csv"])


@router.get("/api/projects/{project_id}/export/csv")
async def export_csv(
    project_id: uuid.UUID,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Task, WorkflowColumn.name.label("column_name"))
        .join(WorkflowColumn, Task.column_id == WorkflowColumn.id)
        .where(Task.project_id == project_id)
        .order_by(WorkflowColumn.position, Task.position)
    )
    rows = result.all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Title", "Description", "Priority", "Status", "Assignee ID", "Due Date", "Created At"])

    for task, column_name in rows:
        writer.writerow([
            task.title,
            task.description or "",
            task.priority.value if task.priority else "",
            column_name,
            str(task.assignee_id) if task.assignee_id else "",
            task.due_date.isoformat() if task.due_date else "",
            task.created_at.isoformat(),
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=tasks-{project_id}.csv"},
    )


@router.post("/api/projects/{project_id}/import/csv")
async def import_csv(
    project_id: uuid.UUID,
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    content = await file.read()
    text = content.decode("utf-8")
    reader = csv.DictReader(io.StringIO(text))

    columns_result = await db.execute(
        select(WorkflowColumn)
        .where(WorkflowColumn.project_id == project_id)
        .order_by(WorkflowColumn.position)
    )
    columns = list(columns_result.scalars().all())
    column_map = {c.name.lower(): c.id for c in columns}
    default_column_id = columns[0].id if columns else None

    imported = 0
    for row in reader:
        title = row.get("Title", "").strip()
        if not title:
            continue

        status_name = row.get("Status", "").strip().lower()
        column_id = column_map.get(status_name, default_column_id)
        if not column_id:
            continue

        from datetime import date as date_type
        due_date = None
        due_str = row.get("Due Date", "").strip()
        if due_str:
            try:
                due_date = date_type.fromisoformat(due_str[:10])
            except ValueError:
                pass

        task = Task(
            project_id=project_id,
            column_id=column_id,
            title=title,
            description=row.get("Description", ""),
            due_date=due_date,
        )
        priority_str = row.get("Priority", "").strip().lower()
        if priority_str in ("urgent", "high", "medium", "low"):
            task.priority = TaskPriority(priority_str)

        db.add(task)
        imported += 1

    await db.commit()
    return envelope({"imported": imported})
