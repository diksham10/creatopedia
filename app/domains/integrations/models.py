# app/domains/integrations/models.py
from typing import Optional, TYPE_CHECKING
from sqlmodel import Field, Relationship
from app.common.base_model import BaseDBModel
from datetime import datetime
import uuid

if TYPE_CHECKING:
    from app.domains.users.models import Creator

class InstagramToken(BaseDBModel, table=True):
    __tablename__ = "instagram_tokens"

    access_token: str = Field(nullable=False)
    token_type: str = Field(default="long_lived")
    scopes: str = Field(default="")
    instagram_user_id: str = Field(nullable=False)
    username: str = Field(nullable=False)
    expires_at: Optional[datetime] = Field(default=None)
    last_refreshed_at: Optional[datetime] = Field(default=None)
    is_valid: bool = Field(default=True)

    creator_id: uuid.UUID = Field(
        foreign_key="creators.id", nullable=False, unique=True, index=True
    )
    creator: Optional["Creator"] = Relationship(back_populates="instagram_token")