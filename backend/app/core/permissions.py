from uuid import UUID

from fastapi import Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user_id
from app.modules.projects.models import Project
from app.modules.workspaces.models import WorkspaceMember, WorkspaceRole

ROLE_HIERARCHY: dict[WorkspaceRole, int] = {
    WorkspaceRole.VIEWER: 0,
    WorkspaceRole.MEMBER: 1,
    WorkspaceRole.ADMIN: 2,
    WorkspaceRole.OWNER: 3,
}


async def get_workspace_member(
    db: AsyncSession, workspace_id: UUID, user_id: UUID
) -> WorkspaceMember | None:
    result = await db.execute(
        select(WorkspaceMember).where(
            WorkspaceMember.workspace_id == workspace_id,
            WorkspaceMember.user_id == user_id,
        )
    )
    return result.scalar_one_or_none()


def require_workspace_role(min_role: WorkspaceRole):
    """Dependency factory that checks the caller has at least `min_role` in the workspace."""

    async def dependency(
        workspace_id: UUID,
        user_id: str = Depends(get_current_user_id),
        db: AsyncSession = Depends(get_db),
    ) -> WorkspaceMember:
        member = await get_workspace_member(db, workspace_id, UUID(user_id))
        if not member:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not a member of this workspace",
            )
        if ROLE_HIERARCHY[member.role] < ROLE_HIERARCHY[min_role]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient role",
            )
        return member

    return dependency


def require_project_role(min_role: WorkspaceRole):
    """Dependency factory that checks the caller has at least `min_role`
    in the workspace that owns the project."""

    async def dependency(
        project_id: UUID,
        user_id: str = Depends(get_current_user_id),
        db: AsyncSession = Depends(get_db),
    ) -> WorkspaceMember:
        project_result = await db.execute(select(Project).where(Project.id == project_id))
        project = project_result.scalar_one_or_none()
        if not project:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

        member = await get_workspace_member(db, project.workspace_id, UUID(user_id))
        if not member:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not a member of this workspace",
            )
        if ROLE_HIERARCHY[member.role] < ROLE_HIERARCHY[min_role]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient role",
            )
        return member

    return dependency
