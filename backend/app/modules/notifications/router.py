from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user_id
from app.core.responses import envelope
from app.modules.notifications.schemas import NotificationResponse, UnreadCountResponse
from app.modules.notifications.service import (
    get_unread_count,
    list_notifications,
    mark_all_read,
    mark_as_read,
)

router = APIRouter(tags=["notifications"])


@router.get("/api/notifications")
async def list_all(
    limit: int = Query(20, ge=1, le=100),
    cursor: str | None = None,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    notifs = await list_notifications(db, UUID(user_id), limit, cursor)
    return envelope([NotificationResponse.model_validate(n).model_dump() for n in notifs])


@router.get("/api/notifications/unread-count")
async def unread_count(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    count = await get_unread_count(db, UUID(user_id))
    return envelope(UnreadCountResponse(count=count).model_dump())


@router.patch("/api/notifications/{notification_id}/read")
async def mark_read(
    notification_id: UUID,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    success = await mark_as_read(db, notification_id, UUID(user_id))
    if not success:
        raise HTTPException(status_code=404, detail="Notification not found")
    return envelope({"read": True})


@router.post("/api/notifications/mark-all-read")
async def mark_all(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    count = await mark_all_read(db, UUID(user_id))
    return envelope({"marked": count})
