import uuid
from datetime import date, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy import case, cast, Date, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user_id
from app.core.responses import envelope
from app.modules.tasks.models import Task
from app.modules.workspaces.models import WorkspaceMember

router = APIRouter(tags=["analytics"])


@router.get("/api/projects/{project_id}/analytics/burndown")
async def burndown(
    project_id: uuid.UUID,
    days: int = Query(30, ge=7, le=90),
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    end = date.today()
    start = end - timedelta(days=days)

    result = await db.execute(
        select(
            cast(Task.created_at, Date).label("day"),
            func.count(Task.id).label("created"),
        )
        .where(Task.project_id == project_id)
        .where(cast(Task.created_at, Date) >= start)
        .group_by("day")
        .order_by("day")
    )
    created_by_day = {str(row.day): row.created for row in result.all()}

    result2 = await db.execute(
        select(
            cast(Task.updated_at, Date).label("day"),
            func.count(Task.id).label("completed"),
        )
        .where(Task.project_id == project_id)
        .where(Task.is_archived == True)  # noqa: E712
        .where(cast(Task.updated_at, Date) >= start)
        .group_by("day")
        .order_by("day")
    )
    completed_by_day = {str(row.day): row.completed for row in result2.all()}

    total_result = await db.scalar(
        select(func.count(Task.id)).where(Task.project_id == project_id)
    )
    total = total_result or 0

    data_points = []
    current = start
    remaining = total
    while current <= end:
        day_str = str(current)
        created = created_by_day.get(day_str, 0)
        completed = completed_by_day.get(day_str, 0)
        remaining = remaining + created - completed
        data_points.append({
            "date": day_str,
            "remaining": max(remaining, 0),
            "created": created,
            "completed": completed,
        })
        current += timedelta(days=1)

    return envelope(data_points)


@router.get("/api/workspaces/{workspace_id}/analytics/workload")
async def workload(
    workspace_id: uuid.UUID,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    from app.modules.auth.models import User

    result = await db.execute(
        select(
            User.id,
            User.full_name,
            func.count(Task.id).label("task_count"),
            func.count(case((Task.is_archived == False, Task.id))).label("active_count"),  # noqa: E712
        )
        .join(WorkspaceMember, WorkspaceMember.user_id == User.id)
        .outerjoin(Task, Task.assignee_id == User.id)
        .where(WorkspaceMember.workspace_id == workspace_id)
        .group_by(User.id, User.full_name)
        .order_by(func.count(Task.id).desc())
    )

    members = [
        {
            "user_id": str(row.id),
            "full_name": row.full_name,
            "task_count": row.task_count,
            "active_count": row.active_count,
        }
        for row in result.all()
    ]
    return envelope(members)


@router.get("/api/projects/{project_id}/analytics/velocity")
async def velocity(
    project_id: uuid.UUID,
    weeks: int = Query(8, ge=1, le=26),
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    end = date.today()
    data = []
    for i in range(weeks):
        week_end = end - timedelta(weeks=i)
        week_start = week_end - timedelta(days=7)

        completed = await db.scalar(
            select(func.count(Task.id))
            .where(Task.project_id == project_id)
            .where(Task.is_archived == True)  # noqa: E712
            .where(cast(Task.updated_at, Date) >= week_start)
            .where(cast(Task.updated_at, Date) < week_end)
        )

        data.append({
            "week_start": str(week_start),
            "week_end": str(week_end),
            "completed": completed or 0,
        })

    data.reverse()
    return envelope(data)
