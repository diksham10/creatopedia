from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid

class InstagramPost(BaseModel):
    id: str
    caption: Optional[str] = None
    media_url: str
    thumbnail_url: Optional[str] = None
    permalink: str
    media_type: str
    timestamp: datetime

class InstagramStatus(BaseModel):
    is_connected: bool
    username: Optional[str] = None
    expires_at: Optional[datetime] = None

class OAuthResponse(BaseModel):
    url: str

class ImportPostRequest(BaseModel):
    post_id: str
    title: Optional[str] = None
    description: Optional[str] = None
    ai_tool: Optional[str] = None
    gate_type: str = "open"
    category_id: Optional[uuid.UUID] = None
