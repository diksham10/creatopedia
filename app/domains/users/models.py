# app/domains/users/models.py
from typing import Optional, List, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship, Column, String
from app.common.base_model import BaseDBModel
from app.common.enums import PlanTier
import uuid

if TYPE_CHECKING:
    from app.domains.prompts.models import Prompt
    from app.domains.ads.models import AdClient
    from app.domains.portfolio.models import Portfolio
    from app.domains.integrations.models import InstagramToken
    from app.domains.analytics.models import EventLog

class Creator(BaseDBModel, table=True):
    __tablename__ = "creators"

    email: str = Field(unique=True, nullable=False, index=True)
    hashed_password: str = Field(nullable=False)
    name: str = Field(nullable=False)
    handle: str = Field(unique=True, nullable=False, index=True)
    subdomain: Optional[str] = Field(
        default=None,
        unique=True, index=True
    )
    bio: Optional[str] = Field(default=None)
    avatar_url: Optional[str] = Field(default=None)
    plan_tier: PlanTier = Field(default=PlanTier.free)
    stripe_id: Optional[str] = Field(default=None)

    # Status flags
    is_active: bool = Field(default=True)
    is_verified: bool = Field(default=False)
    onboarding_complete: bool = Field(default=False)

    # Relationships
    prompts: List["Prompt"] = Relationship(
        back_populates="creator", sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )
    ad_clients: List["AdClient"] = Relationship(
        back_populates="creator", sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )
    portfolio: Optional["Portfolio"] = Relationship(
        back_populates="creator", sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )
    instagram_token: Optional["InstagramToken"] = Relationship(
        back_populates="creator", sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )
    event_logs: List["EventLog"] = Relationship(
        back_populates="creator", sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )