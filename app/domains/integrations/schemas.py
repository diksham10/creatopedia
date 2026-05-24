from pydantic import BaseModel
from typing import Optional
from datetime import datetime

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
