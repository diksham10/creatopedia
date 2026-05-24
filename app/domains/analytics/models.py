# app/domains/analytics/models.py
from typing import Optional, Dict, Any, TYPE_CHECKING
from sqlmodel import Field, Relationship, Column
from sqlalchemy import JSON
from app.common.base_model import BaseDBModel
from app.common.enums import EventType
from datetime import date
import uuid

if TYPE_CHECKING:
    from app.domains.users.models import Creator

class EventLog(BaseDBModel, table=True):
    __tablename__ = "event_logs"

    event_type: EventType = Field(nullable=False, index=True)
    entity_id: Optional[uuid.UUID] = Field(default=None, index=True)
    entity_type: Optional[str] = Field(default=None)       # "prompt" | "campaign" | etc.

    creator_id: Optional[uuid.UUID] = Field(
        default=None, foreign_key="creators.id", index=True
    )
    ip_address: Optional[str] = Field(default=None)
    session_id: Optional[str] = Field(default=None)
    user_agent: Optional[str] = Field(default=None)
    referrer: Optional[str] = Field(default=None)
    event_metadata: Optional[Dict[str, Any]] = Field(
        default=None, sa_column=Column("metadata", JSON)
    )

    creator: Optional["Creator"] = Relationship(back_populates="event_logs")

class AggregatedStat(BaseDBModel, table=True):
    __tablename__ = "aggregated_stats"

    creator_id: uuid.UUID = Field(foreign_key="creators.id", nullable=False, index=True)
    stat_date: date = Field(nullable=False, index=True)

    prompt_views: int = Field(default=0)
    prompt_copies: int = Field(default=0)
    ad_impressions: int = Field(default=0)
    ad_clicks: int = Field(default=0)
    email_captures: int = Field(default=0)
    unique_visitors: int = Field(default=0)