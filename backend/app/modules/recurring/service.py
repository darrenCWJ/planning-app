import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.recurring.models import RecurringRule
from app.modules.tasks.models import Task


RRULE_DELTAS = {
    "daily": timedelta(days=1),
    "weekly": timedelta(weeks=1),
    "monthly": timedelta(days=30),
    "biweekly": timedelta(weeks=2),
}


def compute_next_run(rrule: str, from_dt: datetime) -> datetime:
    delta = RRULE_DELTAS.get(rrule, timedelta(days=1))
    return from_dt + delta


async def create_recurring_rule(
    db: AsyncSession,
    task_id: uuid.UUID,
    project_id: uuid.UUID,
    rrule: str,
    created_by: uuid.UUID,
) -> RecurringRule:
    now = datetime.now(timezone.utc)
    rule = RecurringRule(
        task_id=task_id,
        project_id=project_id,
        rrule=rrule,
        next_run_at=compute_next_run(rrule, now),
        created_by=created_by,
    )
    db.add(rule)
    await db.commit()
    await db.refresh(rule)
    return rule


async def list_task_rules(db: AsyncSession, task_id: uuid.UUID) -> list[RecurringRule]:
    result = await db.execute(
        select(RecurringRule).where(RecurringRule.task_id == task_id)
    )
    return list(result.scalars().all())


async def deactivate_rule(db: AsyncSession, rule_id: uuid.UUID) -> bool:
    rule = await db.get(RecurringRule, rule_id)
    if not rule:
        return False
    rule.is_active = False
    await db.commit()
    return True


async def process_due_recurring(db: AsyncSession) -> int:
    now = datetime.now(timezone.utc)
    result = await db.execute(
        select(RecurringRule)
        .where(RecurringRule.is_active == True, RecurringRule.next_run_at <= now)  # noqa: E712
    )
    rules = list(result.scalars().all())
    created = 0

    for rule in rules:
        template = await db.get(Task, rule.task_id)
        if not template:
            rule.is_active = False
            continue

        new_task = Task(
            project_id=rule.project_id,
            column_id=template.column_id,
            title=template.title,
            description=template.description,
            priority=template.priority,
            assignee_id=template.assignee_id,
        )
        db.add(new_task)
        rule.next_run_at = compute_next_run(rule.rrule, now)
        created += 1

    await db.commit()
    return created
