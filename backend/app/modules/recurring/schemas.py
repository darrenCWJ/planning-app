import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class CreateRecurringRuleRequest(BaseModel):
    rrule: str = Field(..., min_length=1, max_length=100)


class RecurringRuleResponse(BaseModel):
    id: uuid.UUID
    task_id: uuid.UUID
    project_id: uuid.UUID
    rrule: str
    next_run_at: datetime
    is_active: bool
    created_by: uuid.UUID
    created_at: datetime

    model_config = {"from_attributes": True}
