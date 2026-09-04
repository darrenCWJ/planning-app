import os
import re
import uuid
from datetime import datetime, timezone
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.attachments.models import Attachment

UPLOAD_DIR = os.environ.get("UPLOAD_DIR", "./uploads")
MAX_FILE_SIZE = 50 * 1024 * 1024

ALLOWED_CONTENT_TYPES = {
    "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml",
    "application/pdf",
    "text/plain", "text/csv", "text/markdown",
    "application/json",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/zip", "application/gzip", "application/x-tar",
}


def _sanitize_filename(name: str) -> str:
    name = os.path.basename(name)
    name = re.sub(r"[^\w\s\-.]", "", name)
    return name[:255] or "unnamed"


async def upload_attachment(
    db: AsyncSession,
    workspace_id: uuid.UUID,
    uploaded_by: uuid.UUID,
    file_data: bytes,
    original_filename: str,
    content_type: str,
    task_id: uuid.UUID | None = None,
    kb_page_id: uuid.UUID | None = None,
) -> Attachment:
    if len(file_data) > MAX_FILE_SIZE:
        raise ValueError(f"File exceeds maximum size of {MAX_FILE_SIZE // (1024*1024)}MB")

    if content_type not in ALLOWED_CONTENT_TYPES:
        raise ValueError(f"File type {content_type} is not allowed")

    safe_name = _sanitize_filename(original_filename)
    now = datetime.now(timezone.utc)
    file_uuid = uuid.uuid4()
    stored_name = f"{file_uuid}_{safe_name}"

    rel_dir = f"{workspace_id}/{now.year}/{now.month:02d}"
    abs_dir = Path(UPLOAD_DIR) / rel_dir
    abs_dir.mkdir(parents=True, exist_ok=True)

    file_path = abs_dir / stored_name
    file_path.write_bytes(file_data)

    attachment = Attachment(
        workspace_id=workspace_id,
        task_id=task_id,
        kb_page_id=kb_page_id,
        uploaded_by=uploaded_by,
        filename=stored_name,
        original_filename=safe_name,
        content_type=content_type,
        size_bytes=len(file_data),
        storage_path=f"{rel_dir}/{stored_name}",
    )
    db.add(attachment)
    await db.commit()
    await db.refresh(attachment)
    return attachment


async def get_attachment(db: AsyncSession, attachment_id: uuid.UUID) -> Attachment | None:
    return await db.get(Attachment, attachment_id)


async def list_task_attachments(db: AsyncSession, task_id: uuid.UUID) -> list[Attachment]:
    result = await db.execute(
        select(Attachment)
        .where(Attachment.task_id == task_id)
        .order_by(Attachment.created_at.desc())
    )
    return list(result.scalars().all())


async def list_kb_attachments(db: AsyncSession, kb_page_id: uuid.UUID) -> list[Attachment]:
    result = await db.execute(
        select(Attachment)
        .where(Attachment.kb_page_id == kb_page_id)
        .order_by(Attachment.created_at.desc())
    )
    return list(result.scalars().all())


async def delete_attachment(db: AsyncSession, attachment_id: uuid.UUID) -> bool:
    attachment = await db.get(Attachment, attachment_id)
    if not attachment:
        return False

    file_path = Path(UPLOAD_DIR) / attachment.storage_path
    if file_path.exists():
        file_path.unlink()

    await db.delete(attachment)
    await db.commit()
    return True
