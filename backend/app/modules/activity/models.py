import uuid
from datetime import datetime, timezone
from enum import Enum as PyEnum

from sqlalchemy import DateTime, Enum, ForeignKey, Index, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class ActivityAction(str, PyEnum):
    CREATED = "created"
    UPDATED = "updated"
    MOVED = "moved"
    COMMENTED = "commented"
    ASSIGNED = "assigned"
    ARCHIVED = "archived"


class ActivityEntityType(str, PyEnum):
    TASK = "task"
    PROJECT = "project"
    COLUMN = "column"
    COMMENT = "comment"


class Activity(Base):
    __tablename__ = "activities"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    workspace_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("workspaces.id", ondelete="CASCADE")
    )
    project_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=True
    )
    task_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tasks.id", ondelete="CASCADE"), nullable=True
    )
    actor_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id")
    )
    action: Mapped[ActivityAction] = mapped_column(Enum(ActivityAction), nullable=False)
    entity_type: Mapped[ActivityEntityType] = mapped_column(
        Enum(ActivityEntityType), nullable=False
    )
    entity_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    details: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    __table_args__ = (
        Index("ix_activities_workspace_created", "workspace_id", "created_at"),
        Index("ix_activities_task_created", "task_id", "created_at"),
        Index("ix_activities_actor_created", "actor_id", "created_at"),
    )
