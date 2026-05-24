from pydantic import BaseModel
from typing import Optional, Dict, Any
from app.common.enums import EventType
import uuid

class EventCreate(BaseModel):
    event_type: Optional[EventType] = None
    entity_id: Optional[uuid.UUID] = None
    entity_type: Optional[str] = None
    creator_id: Optional[uuid.UUID] = None
    metadata: Optional[Dict[str, Any]] = None
