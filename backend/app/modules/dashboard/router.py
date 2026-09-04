import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user_id
from app.core.responses import envelope
from app.modules.dashboard.service import get_dashboard

router = APIRouter(tags=["dashboard"])


@router.get("/api/users/me/dashboard")
async def dashboard(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    data = await get_dashboard(db, uuid.UUID(user_id))
    return envelope(data)
