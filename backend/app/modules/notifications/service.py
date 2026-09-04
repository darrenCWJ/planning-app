import uuid

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.notifications.models import Notification, NotificationType


async def create_notification(
    db: AsyncSession,
    user_id: uuid.UUID,
    type: NotificationType,
    title: str,
    message: str = "",
    link: str = "",
    activity_id: uuid.UUID | None = None,
) -> Notification:
    notif = Notification(
        user_id=user_id,
        type=type,
        title=title,
        message=message,
        link=link,
        activity_id=activity_id,
    )
    db.add(notif)
    await db.flush()
    return notif


async def list_notifications(
    db: AsyncSession, user_id: uuid.UUID, limit: int = 20, cursor: str | None = None
) -> list[Notification]:
    stmt = (
        select(Notification)
        .where(Notification.user_id == user_id)
        .order_by(Notification.is_read.asc(), Notification.created_at.desc())
        .limit(limit)
    )
    if cursor:
        from datetime import datetime

        cursor_dt = datetime.fromisoformat(cursor)
        stmt = stmt.where(Notification.created_at < cursor_dt)

    result = await db.execute(stmt)
    return list(result.scalars().all())


async def get_unread_count(db: AsyncSession, user_id: uuid.UUID) -> int:
    result = await db.scalar(
        select(func.count(Notification.id))
        .where(Notification.user_id == user_id, Notification.is_read == False)  # noqa: E712
    )
    return result or 0


async def mark_as_read(db: AsyncSession, notification_id: uuid.UUID, user_id: uuid.UUID) -> bool:
    result = await db.execute(
        update(Notification)
        .where(Notification.id == notification_id, Notification.user_id == user_id)
        .values(is_read=True)
    )
    await db.commit()
    return result.rowcount > 0


async def mark_all_read(db: AsyncSession, user_id: uuid.UUID) -> int:
    result = await db.execute(
        update(Notification)
        .where(Notification.user_id == user_id, Notification.is_read == False)  # noqa: E712
        .values(is_read=True)
    )
    await db.commit()
    return result.rowcount
