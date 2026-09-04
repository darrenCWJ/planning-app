from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user_id
from app.core.responses import envelope
from app.core.websocket import manager
from app.modules.projects.schemas import (
    ColumnResponse,
    CreateColumnRequest,
    ReorderColumnsRequest,
    UpdateColumnRequest,
)
from app.modules.projects.service import (
    create_column,
    delete_column,
    reorder_columns,
    update_column,
)

router = APIRouter(tags=["boards"])


@router.post("/api/projects/{project_id}/columns", status_code=status.HTTP_201_CREATED)
async def create(
    project_id: UUID,
    data: CreateColumnRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    column = await create_column(db, project_id, data.name)
    col_data = ColumnResponse.model_validate(column).model_dump()
    await manager.broadcast(
        f"board:{project_id}",
        {"event": "column.created", "data": col_data},
    )
    return envelope(col_data)


@router.patch("/api/columns/{column_id}")
async def update(
    column_id: UUID,
    data: UpdateColumnRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    column = await update_column(db, column_id, data.name)
    if not column:
        raise HTTPException(status_code=404, detail="Column not found")
    col_data = ColumnResponse.model_validate(column).model_dump()
    await manager.broadcast(
        f"board:{column.project_id}",
        {"event": "column.updated", "data": col_data},
    )
    return envelope(col_data)


@router.put("/api/projects/{project_id}/columns/reorder")
async def reorder(
    project_id: UUID,
    data: ReorderColumnsRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    columns = await reorder_columns(db, project_id, data.column_ids)
    cols_data = [ColumnResponse.model_validate(c).model_dump() for c in columns]
    await manager.broadcast(
        f"board:{project_id}",
        {"event": "columns.reordered", "data": cols_data},
    )
    return envelope(cols_data)


@router.delete("/api/columns/{column_id}")
async def delete(
    column_id: UUID,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    try:
        deleted = await delete_column(db, column_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    if not deleted:
        raise HTTPException(status_code=404, detail="Column not found")
    return envelope({"deleted": True})
