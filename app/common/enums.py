# app/common/enums.py
from enum import Enum

class PlanTier(str, Enum):
    free = "free"
    pro = "pro"
    agency = "agency"

class ContentType(str, Enum):
    text = "text"
    pdf ="pdf"

class PromptStatus(str, Enum):
    draft = "draft"
    published = "published"
    archived = "archived"

class GateType(str, Enum):
    open = "open"
    email = "email"
    paid = "paid"

class OutputType(str, Enum):
    text = "text"
    image = "image"
    video = "video"
    audio = "audio"
    code = "code"

class AdStatus(str, Enum):
    draft = "draft"
    active = "active"
    paused = "paused"
    completed = "completed"

class InquiryStatus(str, Enum):
    new = "new"
    read = "read"
    replied = "replied"
    archived = "archived"

class EventType(str, Enum):
    view = "view"
    click = "click"
    copy = "copy"
    email_capture = "email_capture"
    ad_impression = "ad_impression"
    ad_click = "ad_click"

class PageType(str, Enum):
    discovery = "discovery"
    prompt = "prompt"
    category = "category"
    portfolio = "portfolio"
    global_ = "global"