import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.activity.models import Activity, ActivityAction, ActivityEntityType
from app.modules.activity.schemas import ActivityResponse
from app.modules.auth.models import User


async def log_activity(
    db: AsyncSession,
    workspace_id: uuid.UUID,
    actor_id: uuid.UUID,
    action: ActivityAction,
    entity_type: ActivityEntityType,
    entity_id: uuid.UUID,
    project_id: uuid.UUID | None = None,
    task_id: uuid.UUID | None = None,
    details: dict | None = None,
) -> Activity:
    activity = Activity(
        workspace_id=workspace_id,
        project_id=project_id,
        task_id=task_id,
        actor_id=actor_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        details=details,
    )
    db.add(activity)
    await db.flush()
    return activity


async def _list_activity(
    db: AsyncSession,
    where_clause,
    limit: int = 20,
    cursor: str | None = None,
) -> list[dict]:
    stmt = (
        select(Activity, User.full_name)
        .join(User, Activity.actor_id == User.id)
        .where(where_clause)
        .order_by(Activity.created_at.desc())
        .limit(limit)
    )
    if cursor:
        from datetime import datetime

        cursor_dt = datetime.fromisoformat(cursor)
        stmt = stmt.where(Activity.created_at < cursor_dt)

    result = await db.execute(stmt)
    return [
        {
            **ActivityResponse.model_validate(act).model_dump(),
            "actor_name": name,
        }
        for act, name in result.all()
    ]


async def list_task_activity(
    db: AsyncSession, task_id: uuid.UUID, limit: int = 20, cursor: str | None = None
) -> list[dict]:
    return await _list_activity(db, Activity.task_id == task_id, limit, cursor)


async def list_project_activity(
    db: AsyncSession, project_id: uuid.UUID, limit: int = 20, cursor: str | None = None
) -> list[dict]:
    return await _list_activity(db, Activity.project_id == project_id, limit, cursor)


async def list_workspace_activity(
    db: AsyncSession, workspace_id: uuid.UUID, limit: int = 20, cursor: str | None = None
) -> list[dict]:
    return await _list_activity(db, Activity.workspace_id == workspace_id, limit, cursor)
