# app/domains/prompts/models.py
from typing import Optional, List, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship, Column, String
from app.common.base_model import BaseDBModel
from app.common.enums import PromptStatus, GateType, OutputType, ContentType
import uuid

if TYPE_CHECKING:
    from app.domains.users.models import Creator
    from app.domains.ads.models import AdPlacement

class Category(BaseDBModel, table=True):
    __tablename__ = "categories"

    name: str = Field(nullable=False)
    slug: str = Field(unique=True, nullable=False, index=True)
    icon: Optional[str] = Field(default=None)

    prompts: List["Prompt"] = Relationship(back_populates="category")

class Prompt(BaseDBModel, table=True):
    __tablename__ = "prompts"

    title: str = Field(nullable=False)
    slug: str = Field(nullable=False, index=True)           # unique per creator
    description: Optional[str] = Field(default=None)
    content: str = Field(nullable=False)
    thumbnail_url: Optional[str] = Field(default=None)

    content_type: ContentType = Field(default=ContentType.text)
    price: Optional[float] = Field(default=None)            # null = free
    ai_tool: Optional[str] = Field(default=None)            # "ChatGPT", "Midjourney"
    output_type: OutputType = Field(default=OutputType.text)
    gate_type: GateType = Field(default=GateType.open)
    status: PromptStatus = Field(default=PromptStatus.draft)

    # Denormalized counters
    view_count: int = Field(default=0)
    copy_count: int = Field(default=0)

    # Foreign Keys
    creator_id: uuid.UUID = Field(foreign_key="creators.id", nullable=False, index=True)
    category_id: Optional[uuid.UUID] = Field(
        default=None, foreign_key="categories.id", index=True
    )

    # Relationships
    creator: Optional["Creator"] = Relationship(back_populates="prompts")
    category: Optional["Category"] = Relationship(back_populates="prompts")
    email_captures: List["EmailCapture"] = Relationship(
        back_populates="prompt", sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )
    ad_placements: List["AdPlacement"] = Relationship(
        back_populates="prompt", sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )

class EmailCapture(BaseDBModel, table=True):
    __tablename__ = "email_captures"

    email: str = Field(nullable=False, index=True)
    name: Optional[str] = Field(default=None)
    ip_address: Optional[str] = Field(default=None)

    prompt_id: uuid.UUID = Field(foreign_key="prompts.id", nullable=False, index=True)
    prompt: Optional["Prompt"] = Relationship(back_populates="email_captures")