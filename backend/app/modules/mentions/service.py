import re
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.auth.models import User
from app.modules.notifications.models import NotificationType
from app.modules.notifications.service import create_notification


async def process_mentions(
    db: AsyncSession,
    content: str,
    workspace_id: uuid.UUID,
    task_id: uuid.UUID,
    author_id: uuid.UUID,
    task_title: str,
    link: str,
) -> list[uuid.UUID]:
    pattern = re.compile(r"@([\w\s]+?)(?=\s@|\s*$|[.,!?;:])")
    matches = pattern.findall(content)
    if not matches:
        return []

    mentioned_ids: list[uuid.UUID] = []
    for name in matches:
        name = name.strip()
        if not name:
            continue
        result = await db.execute(
            select(User).where(User.full_name.ilike(f"%{name}%"))
        )
        user = result.scalar_one_or_none()
        if user and user.id != author_id:
            await create_notification(
                db,
                user_id=user.id,
                type=NotificationType.MENTIONED,
                title=f"You were mentioned in {task_title}",
                message=f"mentioned by someone in a comment",
                link=link,
            )
            mentioned_ids.append(user.id)

    await db.commit()
    return mentioned_ids
