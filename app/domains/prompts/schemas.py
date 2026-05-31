# app/domains/prompts/schemas.py
from pydantic import BaseModel
from typing import Optional
from app.common.enums import PromptStatus, GateType, OutputType, ContentType
import uuid
from datetime import datetime

class CategoryOut(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    icon: Optional[str]
    class Config: from_attributes = True

class PromptCreate(BaseModel):
    title: str
    content: str
    content_type: ContentType = ContentType.text
    description: Optional[str] = None
    price: Optional[float] = None
    ai_tool: Optional[str] = None
    output_type: OutputType = OutputType.text
    gate_type: GateType = GateType.open
    category_id: Optional[uuid.UUID] = None
    thumbnail_url: Optional[str] = None

class PromptUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    content_type: Optional[ContentType] = None
    description: Optional[str] = None
    status: Optional[PromptStatus] = None
    price: Optional[float] = None
    gate_type: Optional[GateType] = None
    thumbnail_url: Optional[str] = None
    category_id: Optional[uuid.UUID] = None

class PromptOut(BaseModel):
    id: uuid.UUID
    title: str
    slug: str
    description: Optional[str]
    content: str
    content_type: ContentType
    price: Optional[float]
    ai_tool: Optional[str]
    output_type: OutputType
    gate_type: GateType
    status: PromptStatus
    view_count: int
    copy_count: int
    thumbnail_url: Optional[str]
    category_id: Optional[uuid.UUID]
    creator_id: uuid.UUID
    created_at: datetime
    class Config: from_attributes = True

class PromptPageOut(BaseModel):
    """Public-facing prompt page structure"""
    id: uuid.UUID
    title: str
    description: Optional[str]
    content: Optional[str]          # null if gated
    content_type: ContentType
    gate_type: GateType
    price: Optional[float]
    ai_tool: Optional[str]
    output_type: OutputType
    creator: dict
    category: Optional[CategoryOut]
    is_gated: bool
    class Config: from_attributes = True

class EmailCaptureCreate(BaseModel):
    email: str
    name: Optional[str] = None
    prompt_id: uuid.UUID