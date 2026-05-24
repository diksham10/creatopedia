# app/common/base_model.py
import uuid
from datetime import datetime, timezone
from sqlmodel import SQLModel, Field
from typing import Optional

def utcnow():
    return datetime.now(timezone.utc).replace(tzinfo=None)

class BaseDBModel(SQLModel):
    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        index=True,
        nullable=False,
    )
    created_at: datetime = Field(default_factory=utcnow, nullable=False)
    updated_at: Optional[datetime] = Field(default=None)

    # Call this in service layer before update
    def touch(self):
        self.updated_at = utcnow()