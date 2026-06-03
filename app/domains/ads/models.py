# app/domains/ads/models.py
from typing import Optional, List, TYPE_CHECKING
from sqlmodel import Field, Relationship, Column, String
from app.common.base_model import BaseDBModel
from app.common.enums import AdStatus, PageType
from datetime import date
import uuid

if TYPE_CHECKING:
    from app.domains.users.models import Creator
    from app.domains.prompts.models import Prompt, Category

class AdClient(BaseDBModel, table=True):
    __tablename__ = "ad_clients"

    name: str = Field(nullable=False)
    company: Optional[str] = Field(default=None)
    email: str = Field(nullable=False)
    status: AdStatus = Field(default=AdStatus.active)

    creator_id: uuid.UUID = Field(foreign_key="creators.id", nullable=False, index=True)
    creator: Optional["Creator"] = Relationship(back_populates="ad_clients")
    campaigns: List["AdCampaign"] = Relationship(
        back_populates="client", sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )

    # Report access token (unauthenticated report link)
    report_token: str = Field(unique=True, nullable=False, index=True)

class AdCampaign(BaseDBModel, table=True):
    __tablename__ = "ad_campaigns"

    name: str = Field(nullable=False)
    target_url: str = Field(nullable=False)
    banner_url: Optional[str] = Field(default=None)
    status: AdStatus = Field(default=AdStatus.draft)
    budget: Optional[float] = Field(default=None)
    start_date: Optional[date] = Field(default=None)
    end_date: Optional[date] = Field(default=None)

    # Denormalized counters (updated by analytics events)
    impression_count: int = Field(default=0)
    click_count: int = Field(default=0)

    creator_id: uuid.UUID = Field(foreign_key="creators.id", nullable=False, index=True)
    client_id: uuid.UUID = Field(foreign_key="ad_clients.id", nullable=False, index=True)

    client: Optional["AdClient"] = Relationship(back_populates="campaigns")
    placements: List["AdPlacement"] = Relationship(
        back_populates="campaign", sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )

    @property
    def ad_placements(self) -> List["AdPlacement"]:
        return self.placements

class AdPlacement(BaseDBModel, table=True):
    __tablename__ = "ad_placements"

    position: str = Field(nullable=False)                    # "top", "sidebar", "inline"
    page_type: PageType = Field(default=PageType.global_)
    priority: int = Field(default=0)

    campaign_id: uuid.UUID = Field(foreign_key="ad_campaigns.id", nullable=False)
    prompt_id: Optional[uuid.UUID] = Field(
        default=None, foreign_key="prompts.id", index=True
    )
    category_id: Optional[uuid.UUID] = Field(
        default=None, foreign_key="categories.id", index=True
    )

    campaign: Optional["AdCampaign"] = Relationship(back_populates="placements")
    prompt: Optional["Prompt"] = Relationship(back_populates="ad_placements")