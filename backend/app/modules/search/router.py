import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user_id
from app.core.responses import envelope
from app.modules.search.service import search_tasks

router = APIRouter(tags=["search"])


@router.get("/api/workspaces/{workspace_id}/search")
async def search(
    workspace_id: uuid.UUID,
    q: str = Query(..., min_length=1, max_length=200),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    results = await search_tasks(db, workspace_id, q, limit, offset)
    return envelope(results)
