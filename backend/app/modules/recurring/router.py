from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user_id
from app.core.responses import envelope
from app.modules.recurring.schemas import CreateRecurringRuleRequest, RecurringRuleResponse
from app.modules.recurring.service import (
    create_recurring_rule,
    deactivate_rule,
    list_task_rules,
    process_due_recurring,
)
from app.modules.tasks.service import get_task

router = APIRouter(tags=["recurring"])


@router.post("/api/tasks/{task_id}/recurring", status_code=status.HTTP_201_CREATED)
async def create(
    task_id: UUID,
    data: CreateRecurringRuleRequest,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    task = await get_task(db, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    rule = await create_recurring_rule(db, task_id, task.project_id, data.rrule, UUID(user_id))
    return envelope(RecurringRuleResponse.model_validate(rule).model_dump())


@router.get("/api/tasks/{task_id}/recurring")
async def list_rules(
    task_id: UUID,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    rules = await list_task_rules(db, task_id)
    return envelope([RecurringRuleResponse.model_validate(r).model_dump() for r in rules])


@router.delete("/api/recurring/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
async def deactivate(
    rule_id: UUID,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    success = await deactivate_rule(db, rule_id)
    if not success:
        raise HTTPException(status_code=404, detail="Rule not found")


@router.post("/api/recurring/process")
async def trigger_process(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    count = await process_due_recurring(db)
    return envelope({"tasks_created": count})
