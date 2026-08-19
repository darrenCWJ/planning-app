from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user_id
from app.core.permissions import require_project_role
from app.core.responses import envelope
from app.core.websocket import manager
from app.modules.tasks.schemas import (
    BoardResponse,
    CommentRequest,
    CommentResponse,
    CreateTaskRequest,
    MoveTaskRequest,
    TaskResponse,
    UpdateTaskRequest,
)
from app.modules.tasks.service import (
    add_comment,
    create_task,
    get_board,
    get_task,
    list_comments,
    list_tasks,
    move_task,
    update_task,
)
from app.modules.workspaces.models import WorkspaceRole

router = APIRouter(tags=["tasks"])


@router.post("/api/projects/{project_id}/tasks", status_code=status.HTTP_201_CREATED)
async def create(
    project_id: UUID,
    data: CreateTaskRequest,
    _member=Depends(require_project_role(WorkspaceRole.MEMBER)),
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    task = await create_task(
        db, project_id, data.title, data.description, data.priority, data.assignee_id, data.due_date
    )
    task_data = TaskResponse.model_validate(task).model_dump()
    await manager.broadcast(
        f"board:{task.project_id}",
        {"event": "task.created", "data": task_data},
    )
    return envelope(task_data)


@router.get("/api/projects/{project_id}/tasks")
async def list_project_tasks(
    project_id: UUID,
    priority: str | None = None,
    search: str | None = None,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    tasks = await list_tasks(db, project_id, priority=priority, search=search)
    return envelope([TaskResponse.model_validate(t).model_dump() for t in tasks])


@router.get("/api/projects/{project_id}/board")
async def get_project_board(
    project_id: UUID,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    board = await get_board(db, project_id)
    return envelope(BoardResponse.model_validate(board).model_dump())


@router.get("/api/tasks/{task_id}")
async def get_task_detail(
    task_id: UUID,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    task = await get_task(db, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return envelope(TaskResponse.model_validate(task).model_dump())


@router.patch("/api/tasks/{task_id}")
async def update(
    task_id: UUID,
    data: UpdateTaskRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    task = await update_task(db, task_id, **data.model_dump(exclude_unset=True))
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    task_data = TaskResponse.model_validate(task).model_dump()
    await manager.broadcast(
        f"board:{task.project_id}",
        {"event": "task.updated", "data": task_data},
    )
    return envelope(task_data)


@router.post("/api/tasks/{task_id}/move")
async def move(
    task_id: UUID,
    data: MoveTaskRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    task = await move_task(db, task_id, data.column_id, data.position)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    task_data = TaskResponse.model_validate(task).model_dump()
    await manager.broadcast(
        f"board:{task.project_id}",
        {"event": "task.moved", "data": task_data},
    )
    return envelope(task_data)


@router.delete("/api/tasks/{task_id}")
async def archive(
    task_id: UUID,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    task = await update_task(db, task_id, is_archived=True)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    await manager.broadcast(
        f"board:{task.project_id}",
        {"event": "task.archived", "data": {"id": str(task_id)}},
    )
    return envelope({"archived": True})


@router.post("/api/tasks/{task_id}/comments", status_code=status.HTTP_201_CREATED)
async def create_comment(
    task_id: UUID,
    data: CommentRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    comment = await add_comment(db, task_id, UUID(user_id), data.content)
    return envelope(CommentResponse.model_validate(comment).model_dump())


@router.get("/api/tasks/{task_id}/comments")
async def get_comments(
    task_id: UUID,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    comments = await list_comments(db, task_id)
    return envelope([CommentResponse.model_validate(c).model_dump() for c in comments])
