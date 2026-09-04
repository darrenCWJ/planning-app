import hashlib
import hmac
import json
import uuid

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.webhooks.models import Webhook


async def create_webhook(
    db: AsyncSession, workspace_id: uuid.UUID, url: str, events: list[str], secret: str = ""
) -> Webhook:
    webhook = Webhook(workspace_id=workspace_id, url=url, events=events, secret=secret)
    db.add(webhook)
    await db.commit()
    await db.refresh(webhook)
    return webhook


async def list_webhooks(db: AsyncSession, workspace_id: uuid.UUID) -> list[Webhook]:
    result = await db.execute(
        select(Webhook).where(Webhook.workspace_id == workspace_id).order_by(Webhook.created_at)
    )
    return list(result.scalars().all())


async def update_webhook(db: AsyncSession, webhook_id: uuid.UUID, **kwargs) -> Webhook | None:
    webhook = await db.get(Webhook, webhook_id)
    if not webhook:
        return None
    for key, value in kwargs.items():
        if value is not None:
            setattr(webhook, key, value)
    await db.commit()
    await db.refresh(webhook)
    return webhook


async def delete_webhook(db: AsyncSession, webhook_id: uuid.UUID) -> bool:
    webhook = await db.get(Webhook, webhook_id)
    if not webhook:
        return False
    await db.delete(webhook)
    await db.commit()
    return True


async def fire_webhooks(
    db: AsyncSession, workspace_id: uuid.UUID, event: str, payload: dict
) -> int:
    result = await db.execute(
        select(Webhook)
        .where(Webhook.workspace_id == workspace_id, Webhook.is_active == True)  # noqa: E712
    )
    webhooks = list(result.scalars().all())
    fired = 0
    async with httpx.AsyncClient(timeout=10.0) as client:
        for wh in webhooks:
            if event not in wh.events:
                continue
            body = json.dumps({"event": event, "data": payload})
            headers = {"Content-Type": "application/json"}
            if wh.secret:
                sig = hmac.new(wh.secret.encode(), body.encode(), hashlib.sha256).hexdigest()
                headers["X-Webhook-Signature"] = sig
            try:
                await client.post(wh.url, content=body, headers=headers)
                fired += 1
            except Exception:
                pass
    return fired
