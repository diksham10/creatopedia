# app/domains/ads/schemas.py
from pydantic import BaseModel, HttpUrl, Field
from typing import Optional, List
from app.common.enums import AdStatus, PageType
from datetime import date
import uuid

# --- AdClient Schemas ---

class AdClientBase(BaseModel):
    name: str
    company: Optional[str] = None
    email: str
    status: AdStatus = AdStatus.active

class AdClientCreate(AdClientBase):
    pass

class AdClientUpdate(BaseModel):
    name: Optional[str] = None
    company: Optional[str] = None
    email: Optional[str] = None
    status: Optional[AdStatus] = None

class AdClientOut(AdClientBase):
    id: uuid.UUID
    report_token: str
    creator_id: uuid.UUID

    class Config:
        from_attributes = True

# --- AdPlacement Schemas ---

class AdPlacementBase(BaseModel):
    position: str
    page_type: PageType = PageType.global_
    priority: int = 0
    prompt_id: Optional[uuid.UUID] = None
    category_id: Optional[uuid.UUID] = None

class AdPlacementCreate(AdPlacementBase):
    pass

class AdPlacementOut(AdPlacementBase):
    id: uuid.UUID
    campaign_id: uuid.UUID

    class Config:
        from_attributes = True

# --- AdCampaign Schemas ---

class AdCampaignBase(BaseModel):
    name: str
    target_url: str
    banner_url: Optional[str] = None
    status: AdStatus = AdStatus.draft
    budget: Optional[float] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None

class AdCampaignCreate(AdCampaignBase):
    client_id: uuid.UUID
    placements: Optional[List[AdPlacementCreate]] = None

class AdCampaignUpdate(BaseModel):
    name: Optional[str] = None
    target_url: Optional[str] = None
    banner_url: Optional[str] = None
    status: Optional[AdStatus] = None
    budget: Optional[float] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    placements: Optional[List[AdPlacementCreate]] = None

class AdCampaignOut(AdCampaignBase):
    id: uuid.UUID
    click_count: int
    impression_count: int
    client_id: uuid.UUID
    creator_id: uuid.UUID
    ad_placements: Optional[List[AdPlacementOut]] = None

    class Config:
        from_attributes = True

class DiscoverySlotSchema(BaseModel):
    index: int
    campaign_id: uuid.UUID

class DiscoverySlotsUpdate(BaseModel):
    slots: List[DiscoverySlotSchema]