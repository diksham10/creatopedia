# app/domains/portfolio/models.py
from typing import Optional, List, TYPE_CHECKING
from sqlmodel import Field, Relationship, Column, String
from app.common.base_model import BaseDBModel
from app.common.enums import InquiryStatus
import uuid

if TYPE_CHECKING:
    from app.domains.users.models import Creator
    from app.domains.prompts.models import Prompt

class Portfolio(BaseDBModel, table=True):
    __tablename__ = "portfolios"

    published: bool = Field(default=False)
    slug: str = Field(unique=True, nullable=False, index=True)
    seo_title: Optional[str] = Field(default=None)
    seo_description: Optional[str] = Field(default=None)
    theme_color: Optional[str] = Field(default="#6366f1")
    font_family: Optional[str] = Field(default="Inter")
    custom_domain: Optional[str] = Field(
        default=None, unique=True
    )

    creator_id: uuid.UUID = Field(foreign_key="creators.id", nullable=False, unique=True)


    creator: Optional["Creator"] = Relationship(back_populates="portfolio")
    hero: Optional["PortfolioHero"] = Relationship(
        back_populates="portfolio", sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )
    stats: List["PortfolioStat"] = Relationship(
        back_populates="portfolio", sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )
    works: List["PortfolioWork"] = Relationship(
        back_populates="portfolio", sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )

class PortfolioHero(BaseDBModel, table=True):
    __tablename__ = "portfolio_heroes"

    headline: Optional[str] = Field(default=None)
    subheadline: Optional[str] = Field(default=None)
    cta_text: Optional[str] = Field(default=None)
    cta_url: Optional[str] = Field(default=None)
    background_url: Optional[str] = Field(default=None)

    portfolio_id: uuid.UUID = Field(foreign_key="portfolios.id", nullable=False, unique=True)
    portfolio: Optional["Portfolio"] = Relationship(back_populates="hero")

class PortfolioStat(BaseDBModel, table=True):
    __tablename__ = "portfolio_stats"

    label: str = Field(nullable=False)
    value: str = Field(nullable=False)
    icon: Optional[str] = Field(default=None)
    sort_order: int = Field(default=0)

    portfolio_id: uuid.UUID = Field(foreign_key="portfolios.id", nullable=False, index=True)
    portfolio: Optional["Portfolio"] = Relationship(back_populates="stats")

class PortfolioWork(BaseDBModel, table=True):
    __tablename__ = "portfolio_works"

    title: str = Field(nullable=False)
    description: Optional[str] = Field(default=None)
    image_url: Optional[str] = Field(default=None)
    external_url: Optional[str] = Field(default=None)
    sort_order: int = Field(default=0)

    portfolio_id: uuid.UUID = Field(foreign_key="portfolios.id", nullable=False, index=True)
    prompt_id: Optional[uuid.UUID] = Field(default=None, foreign_key="prompts.id")

    portfolio: Optional["Portfolio"] = Relationship(back_populates="works")

class Inquiry(BaseDBModel, table=True):
    __tablename__ = "inquiries"

    name: str = Field(nullable=False)
    email: str = Field(nullable=False)
    message: str = Field(nullable=False)
    source: Optional[str] = Field(default=None)
    status: InquiryStatus = Field(default=InquiryStatus.new)
    read_at: Optional[str] = Field(default=None)
    replied_at: Optional[str] = Field(default=None)

    creator_id: Optional[uuid.UUID] = Field(
        default=None, foreign_key="creators.id", index=True
    )