from base64 import b64decode, b64encode
from typing import Any

from sqlalchemy import Select, asc, desc
from sqlalchemy.ext.asyncio import AsyncSession


def encode_cursor(value: Any) -> str:
    return b64encode(str(value).encode()).decode()


def decode_cursor(cursor: str) -> str:
    return b64decode(cursor.encode()).decode()


async def paginate(
    db: AsyncSession,
    query: Select,
    cursor: str | None = None,
    limit: int = 50,
    order_column=None,
    direction: str = "desc",
) -> tuple[list, dict]:
    if order_column is None:
        raise ValueError("order_column is required")

    if direction == "desc":
        query = query.order_by(desc(order_column))
    else:
        query = query.order_by(asc(order_column))

    if cursor:
        cursor_value = decode_cursor(cursor)
        if direction == "desc":
            query = query.where(order_column < cursor_value)
        else:
            query = query.where(order_column > cursor_value)

    query = query.limit(limit + 1)
    result = await db.execute(query)
    items = list(result.scalars().all())

    has_next = len(items) > limit
    if has_next:
        items = items[:limit]

    next_cursor = None
    if has_next and items:
        last_item = items[-1]
        cursor_val = getattr(last_item, order_column.key)
        next_cursor = encode_cursor(cursor_val)

    meta = {
        "limit": limit,
        "next_cursor": next_cursor,
        "has_next": has_next,
    }

    return items, meta
