from pathlib import Path
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user_id
from app.core.responses import envelope
from app.modules.attachments.schemas import AttachmentResponse
from app.modules.attachments.service import (
    UPLOAD_DIR,
    delete_attachment,
    get_attachment,
    list_kb_attachments,
    list_task_attachments,
    upload_attachment,
)

router = APIRouter(tags=["attachments"])


@router.post("/api/attachments/upload", status_code=status.HTTP_201_CREATED)
async def upload(
    file: UploadFile = File(...),
    workspace_id: UUID = Form(...),
    task_id: UUID | None = Form(None),
    kb_page_id: UUID | None = Form(None),
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    file_data = await file.read()
    try:
        attachment = await upload_attachment(
            db,
            workspace_id=workspace_id,
            uploaded_by=UUID(user_id),
            file_data=file_data,
            original_filename=file.filename or "unnamed",
            content_type=file.content_type or "application/octet-stream",
            task_id=task_id,
            kb_page_id=kb_page_id,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return envelope(AttachmentResponse.model_validate(attachment).model_dump())


@router.get("/api/attachments/{attachment_id}/download")
async def download(
    attachment_id: UUID,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    attachment = await get_attachment(db, attachment_id)
    if not attachment:
        raise HTTPException(status_code=404, detail="Attachment not found")

    file_path = Path(UPLOAD_DIR) / attachment.storage_path
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found on disk")

    return FileResponse(
        path=str(file_path),
        media_type=attachment.content_type,
        filename=attachment.original_filename,
    )


@router.get("/api/tasks/{task_id}/attachments")
async def task_attachments(
    task_id: UUID,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    items = await list_task_attachments(db, task_id)
    return envelope([AttachmentResponse.model_validate(a).model_dump() for a in items])


@router.get("/api/kb/{page_id}/attachments")
async def kb_attachments(
    page_id: UUID,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    items = await list_kb_attachments(db, page_id)
    return envelope([AttachmentResponse.model_validate(a).model_dump() for a in items])


@router.delete("/api/attachments/{attachment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete(
    attachment_id: UUID,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    deleted = await delete_attachment(db, attachment_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Attachment not found")
