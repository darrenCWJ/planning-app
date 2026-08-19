from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user_id
from app.core.responses import envelope
from app.modules.projects.schemas import (
    CreateProjectRequest,
    ProjectResponse,
    UpdateProjectRequest,
)
from app.modules.projects.service import (
    create_project,
    get_project,
    list_projects,
    update_project,
)

router = APIRouter(tags=["projects"])


@router.post("/api/workspaces/{workspace_id}/projects", status_code=status.HTTP_201_CREATED)
async def create(
    workspace_id: UUID,
    data: CreateProjectRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    project = await create_project(db, workspace_id, data.name, data.key, data.description)
    return envelope(ProjectResponse.model_validate(project).model_dump())


@router.get("/api/workspaces/{workspace_id}/projects")
async def list_workspace_projects(
    workspace_id: UUID,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    projects = await list_projects(db, workspace_id)
    return envelope([ProjectResponse.model_validate(p).model_dump() for p in projects])


@router.get("/api/projects/{project_id}")
async def get_project_detail(
    project_id: UUID,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    project = await get_project(db, project_id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return envelope(ProjectResponse.model_validate(project).model_dump())


@router.patch("/api/projects/{project_id}")
async def update(
    project_id: UUID,
    data: UpdateProjectRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    project = await update_project(db, project_id, data.name, data.description)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return envelope(ProjectResponse.model_validate(project).model_dump())
