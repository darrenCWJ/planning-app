from uuid import UUID

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.auth.models import User
from app.modules.workspaces.exceptions import MemberAlreadyExistsError, UserNotFoundError
from app.modules.workspaces.models import Workspace, WorkspaceMember, WorkspaceRole


async def create_workspace(db: AsyncSession, name: str, slug: str, user_id: UUID) -> Workspace:
    workspace = Workspace(name=name, slug=slug, created_by=user_id)
    db.add(workspace)
    await db.flush()

    member = WorkspaceMember(
        workspace_id=workspace.id, user_id=user_id, role=WorkspaceRole.OWNER
    )
    db.add(member)
    await db.commit()
    await db.refresh(workspace)
    return workspace


async def list_user_workspaces(db: AsyncSession, user_id: UUID) -> list[Workspace]:
    result = await db.execute(
        select(Workspace)
        .join(WorkspaceMember)
        .where(WorkspaceMember.user_id == user_id)
    )
    return list(result.scalars().all())


async def get_workspace(db: AsyncSession, workspace_id: UUID) -> Workspace | None:
    result = await db.execute(select(Workspace).where(Workspace.id == workspace_id))
    return result.scalar_one_or_none()


async def invite_member(
    db: AsyncSession, workspace_id: UUID, email: str, role: WorkspaceRole
) -> WorkspaceMember:
    user_result = await db.execute(select(User).where(User.email == email))
    user = user_result.scalar_one_or_none()
    if not user:
        raise UserNotFoundError(f"No user with email '{email}' found")

    member = WorkspaceMember(workspace_id=workspace_id, user_id=user.id, role=role)
    db.add(member)
    try:
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        raise MemberAlreadyExistsError(
            f"User '{email}' is already a member of this workspace"
        ) from exc
    await db.refresh(member)
    return member


async def list_members(db: AsyncSession, workspace_id: UUID) -> list[dict]:
    result = await db.execute(
        select(WorkspaceMember, User.email, User.full_name)
        .join(User, WorkspaceMember.user_id == User.id)
        .where(WorkspaceMember.workspace_id == workspace_id)
    )
    rows = result.all()
    return [
        {
            "id": str(member.id),
            "user_id": str(member.user_id),
            "role": member.role.value,
            "joined_at": member.joined_at.isoformat(),
            "email": email,
            "full_name": full_name,
        }
        for member, email, full_name in rows
    ]
