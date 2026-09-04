import re
import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.kb.models import KBPage


def _slugify(title: str) -> str:
    slug = re.sub(r"[^\w\s-]", "", title.lower().strip())
    return re.sub(r"[-\s]+", "-", slug)[:200]


async def create_page(
    db: AsyncSession,
    workspace_id: uuid.UUID,
    user_id: uuid.UUID,
    title: str,
    content: str = "",
    parent_id: uuid.UUID | None = None,
) -> KBPage:
    base_slug = _slugify(title)
    slug = base_slug

    existing = await db.scalar(
        select(func.count(KBPage.id))
        .where(KBPage.workspace_id == workspace_id, KBPage.slug.like(f"{base_slug}%"))
    )
    if existing:
        slug = f"{base_slug}-{existing}"

    max_pos = await db.scalar(
        select(KBPage.position)
        .where(KBPage.workspace_id == workspace_id, KBPage.parent_id == parent_id)
        .order_by(KBPage.position.desc())
        .limit(1)
    )

    page = KBPage(
        workspace_id=workspace_id,
        parent_id=parent_id,
        title=title,
        slug=slug,
        content=content,
        created_by=user_id,
        updated_by=user_id,
        position=(max_pos or 0) + 1,
    )
    db.add(page)
    await db.commit()
    await db.refresh(page)
    return page


async def get_page(db: AsyncSession, page_id: uuid.UUID) -> KBPage | None:
    return await db.get(KBPage, page_id)


async def list_pages_tree(db: AsyncSession, workspace_id: uuid.UUID) -> list[dict]:
    result = await db.execute(
        select(KBPage)
        .where(KBPage.workspace_id == workspace_id, KBPage.is_archived == False)  # noqa: E712
        .order_by(KBPage.position)
    )
    pages = list(result.scalars().all())

    pages_by_parent: dict[str | None, list] = {}
    for p in pages:
        key = str(p.parent_id) if p.parent_id else None
        pages_by_parent.setdefault(key, []).append(p)

    def build_tree(parent_key: str | None) -> list[dict]:
        children = pages_by_parent.get(parent_key, [])
        return [
            {
                "id": str(p.id),
                "title": p.title,
                "slug": p.slug,
                "parent_id": str(p.parent_id) if p.parent_id else None,
                "position": p.position,
                "children": build_tree(str(p.id)),
            }
            for p in children
        ]

    return build_tree(None)


async def update_page(
    db: AsyncSession,
    page_id: uuid.UUID,
    user_id: uuid.UUID,
    **kwargs,
) -> KBPage | None:
    page = await db.get(KBPage, page_id)
    if not page:
        return None
    for key, value in kwargs.items():
        if value is not None:
            setattr(page, key, value)
    page.updated_by = user_id
    await db.commit()
    await db.refresh(page)
    return page


async def archive_page(db: AsyncSession, page_id: uuid.UUID) -> bool:
    page = await db.get(KBPage, page_id)
    if not page:
        return False
    page.is_archived = True
    await db.commit()
    return True


async def search_pages(
    db: AsyncSession, workspace_id: uuid.UUID, query: str, limit: int = 20
) -> list[KBPage]:
    ts_query = func.plainto_tsquery("english", query)
    ts_vector = func.to_tsvector(
        "english", KBPage.title + " " + func.coalesce(KBPage.content, "")
    )
    result = await db.execute(
        select(KBPage)
        .where(KBPage.workspace_id == workspace_id)
        .where(KBPage.is_archived == False)  # noqa: E712
        .where(ts_vector.bool_op("@@")(ts_query))
        .order_by(func.ts_rank(ts_vector, ts_query).desc())
        .limit(limit)
    )
    return list(result.scalars().all())
