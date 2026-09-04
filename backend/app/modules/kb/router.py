from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user_id
from app.core.responses import envelope
from app.modules.auth.models import User
from app.modules.kb.schemas import (
    CreateKBPageRequest,
    KBPageResponse,
    UpdateKBPageRequest,
)
from app.modules.kb.service import (
    archive_page,
    create_page,
    get_page,
    list_pages_tree,
    search_pages,
    update_page,
)

router = APIRouter(tags=["kb"])


@router.post("/api/workspaces/{workspace_id}/kb", status_code=status.HTTP_201_CREATED)
async def create(
    workspace_id: UUID,
    data: CreateKBPageRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    page = await create_page(
        db, workspace_id, UUID(user_id), data.title, data.content, data.parent_id
    )
    editor = await db.get(User, page.updated_by)
    resp = KBPageResponse.model_validate(page).model_dump()
    resp["updated_by_name"] = editor.full_name if editor else None
    return envelope(resp)


@router.get("/api/workspaces/{workspace_id}/kb")
async def list_tree(
    workspace_id: UUID,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    tree = await list_pages_tree(db, workspace_id)
    return envelope(tree)


@router.get("/api/workspaces/{workspace_id}/kb/search")
async def search(
    workspace_id: UUID,
    q: str = Query(..., min_length=1, max_length=200),
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    pages = await search_pages(db, workspace_id, q)
    return envelope([KBPageResponse.model_validate(p).model_dump() for p in pages])


@router.get("/api/kb/{page_id}")
async def get_detail(
    page_id: UUID,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    page = await get_page(db, page_id)
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    editor = await db.get(User, page.updated_by)
    data = KBPageResponse.model_validate(page).model_dump()
    data["updated_by_name"] = editor.full_name if editor else None
    return envelope(data)


@router.patch("/api/kb/{page_id}")
async def update(
    page_id: UUID,
    data: UpdateKBPageRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    page = await update_page(db, page_id, UUID(user_id), **data.model_dump(exclude_unset=True))
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    editor = await db.get(User, page.updated_by)
    resp = KBPageResponse.model_validate(page).model_dump()
    resp["updated_by_name"] = editor.full_name if editor else None
    return envelope(resp)


@router.delete("/api/kb/{page_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete(
    page_id: UUID,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    archived = await archive_page(db, page_id)
    if not archived:
        raise HTTPException(status_code=404, detail="Page not found")
