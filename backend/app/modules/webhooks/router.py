from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user_id
from app.core.responses import envelope
from app.modules.webhooks.schemas import CreateWebhookRequest, UpdateWebhookRequest, WebhookResponse
from app.modules.webhooks.service import create_webhook, delete_webhook, list_webhooks, update_webhook

router = APIRouter(tags=["webhooks"])


@router.post("/api/workspaces/{workspace_id}/webhooks", status_code=status.HTTP_201_CREATED)
async def create(
    workspace_id: UUID,
    data: CreateWebhookRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    wh = await create_webhook(db, workspace_id, data.url, data.events, data.secret)
    return envelope(WebhookResponse.model_validate(wh).model_dump())


@router.get("/api/workspaces/{workspace_id}/webhooks")
async def list_all(
    workspace_id: UUID,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    webhooks = await list_webhooks(db, workspace_id)
    return envelope([WebhookResponse.model_validate(w).model_dump() for w in webhooks])


@router.patch("/api/webhooks/{webhook_id}")
async def update(
    webhook_id: UUID,
    data: UpdateWebhookRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    wh = await update_webhook(db, webhook_id, **data.model_dump(exclude_unset=True))
    if not wh:
        raise HTTPException(status_code=404, detail="Webhook not found")
    return envelope(WebhookResponse.model_validate(wh).model_dump())


@router.delete("/api/webhooks/{webhook_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete(
    webhook_id: UUID,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    if not await delete_webhook(db, webhook_id):
        raise HTTPException(status_code=404, detail="Webhook not found")
