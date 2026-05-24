# app/domains/users/schemas.py
from pydantic import BaseModel, EmailStr
from typing import Optional
from app.common.enums import PlanTier
import uuid
from datetime import datetime

class CreatorPublic(BaseModel):
    id: uuid.UUID
    name: str
    handle: str
    subdomain: str
    bio: Optional[str]
    avatar_url: Optional[str]
    plan_tier: PlanTier
    onboarding_complete: bool
    created_at: datetime

    class Config:
        from_attributes = True

class CreatorInitRequest(BaseModel):
    name: str
    handle: str
    subdomain: Optional[str] = None
    bio: Optional[str] = None

class CreatorUpdateRequest(BaseModel):
    name: Optional[str] = None
    subdomain: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    theme_color: Optional[str] = None
    font_family: Optional[str] = None