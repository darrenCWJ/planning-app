import uuid
from datetime import datetime

from pydantic import BaseModel


class AttachmentResponse(BaseModel):
    id: uuid.UUID
    workspace_id: uuid.UUID
    task_id: uuid.UUID | None
    kb_page_id: uuid.UUID | None
    uploaded_by: uuid.UUID
    filename: str
    original_filename: str
    content_type: str
    size_bytes: int
    created_at: datetime

    model_config = {"from_attributes": True}
