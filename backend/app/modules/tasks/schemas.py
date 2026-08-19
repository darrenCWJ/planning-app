from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel

from app.modules.tasks.models import TaskPriority


class CreateTaskRequest(BaseModel):
    title: str
    description: str = ""
    priority: TaskPriority = TaskPriority.MEDIUM
    assignee_id: UUID | None = None
    due_date: date | None = None


class UpdateTaskRequest(BaseModel):
    title: str | None = None
    description: str | None = None
    priority: TaskPriority | None = None
    assignee_id: UUID | None = None
    due_date: date | None = None


class MoveTaskRequest(BaseModel):
    column_id: UUID
    position: str


class TaskResponse(BaseModel):
    id: UUID
    project_id: UUID
    column_id: UUID
    title: str
    description: str
    priority: TaskPriority
    assignee_id: UUID | None
    position: str
    due_date: date | None
    is_archived: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CommentRequest(BaseModel):
    content: str


class CommentResponse(BaseModel):
    id: UUID
    task_id: UUID
    author_id: UUID
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}


class BoardColumnResponse(BaseModel):
    id: UUID
    name: str
    position: str
    tasks: list[TaskResponse] = []

    model_config = {"from_attributes": True}


class BoardResponse(BaseModel):
    project_id: UUID
    columns: list[BoardColumnResponse]

    model_config = {"from_attributes": True}
