from pydantic import BaseModel
from typing import Optional, List
import uuid

class PortfolioHeroOut(BaseModel):
    headline: Optional[str] = None
    subheadline: Optional[str] = None
    cta_text: Optional[str] = None
    cta_url: Optional[str] = None
    background_url: Optional[str] = None

class PortfolioStatOut(BaseModel):
    label: str
    value: str
    icon: Optional[str] = None

class PortfolioWorkOut(BaseModel):
    title: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    external_url: Optional[str] = None

class CreatorPublicOut(BaseModel):
    id: uuid.UUID
    name: str
    handle: str
    bio: Optional[str] = None
    avatar_url: Optional[str] = None

class PortfolioPublicOut(BaseModel):
    id: uuid.UUID
    slug: str
    theme_color: Optional[str]
    font_family: Optional[str]
    hero: Optional[PortfolioHeroOut]
    stats: List[PortfolioStatOut]
    works: List[PortfolioWorkOut]
    creator: CreatorPublicOut
