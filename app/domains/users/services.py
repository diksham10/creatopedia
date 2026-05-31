# app/domains/users/services.py
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select
from app.domains.users.models import Creator
from app.domains.users.schemas import CreatorInitRequest, CreatorUpdateRequest
from app.common.exceptions import ConflictError, NotFoundError
import uuid
import re
from app.core.config import settings

async def get_creator_by_id(db: AsyncSession, creator_id: str | uuid.UUID) -> Creator | None:
    result = await db.exec(select(Creator).where(Creator.id == creator_id))
    return result.first()

async def init_creator_profile(
    db: AsyncSession, creator: Creator, data: CreatorInitRequest
) -> Creator:
    if creator.onboarding_complete:
        return creator  # idempotent

    if data.subdomain:
        # Normalize and validate subdomain
        sub = data.subdomain.strip().lower()
        # Basic format: 1-63 chars, letters/numbers/hyphen, cannot start/end with hyphen
        if not re.match(r"^[a-z0-9](?:[a-z0-9\-]{0,61}[a-z0-9])?$", sub):
            raise ConflictError("Invalid subdomain format")
        # Check blacklist from settings (comma-separated)
        blacklist_raw = getattr(settings, "SUBDOMAIN_BLACKLIST", None)
        if blacklist_raw:
            blacklisted = [s.strip().lower() for s in blacklist_raw.split(",") if s.strip()]
            if sub in blacklisted:
                raise ConflictError("Subdomain not allowed")
        taken = await db.exec(
            select(Creator).where(
                Creator.subdomain == sub,
                Creator.id != creator.id
            )
        )
        if taken.first():
            raise ConflictError("Subdomain already taken")
        creator.subdomain = sub

    creator.name = data.name or creator.name
    creator.handle = data.handle or creator.handle
    creator.bio = data.bio
    creator.onboarding_complete = True
    creator.touch()

    db.add(creator)
    await db.commit()
    await db.refresh(creator)
    return creator

async def update_creator(
    db: AsyncSession, creator: Creator, data: CreatorUpdateRequest
) -> Creator:
    # Separate creator fields vs portfolio fields
    update_data = data.model_dump(exclude_unset=True)
    
    portfolio_fields = ["theme_color", "font_family"]
    creator_data = {k: v for k, v in update_data.items() if k not in portfolio_fields}
    portfolio_data = {k: v for k, v in update_data.items() if k in portfolio_fields}

    # Update creator table
    # If subdomain is being updated, validate similarly
    if "subdomain" in creator_data and creator_data.get("subdomain") is not None:
        sub = str(creator_data.get("subdomain")).strip().lower()
        if not re.match(r"^[a-z0-9](?:[a-z0-9\-]{0,61}[a-z0-9])?$", sub):
            raise ConflictError("Invalid subdomain format")
        blacklist_raw = getattr(settings, "SUBDOMAIN_BLACKLIST", None)
        if blacklist_raw:
            blacklisted = [s.strip().lower() for s in blacklist_raw.split(",") if s.strip()]
            if sub in blacklisted:
                raise ConflictError("Subdomain not allowed")
        taken = await db.exec(
            select(Creator).where(Creator.subdomain == sub, Creator.id != creator.id)
        )
        if taken.first():
            raise ConflictError("Subdomain already taken")
        creator.subdomain = sub

    for field, value in {k: v for k, v in creator_data.items() if k != "subdomain"}.items():
        setattr(creator, field, value)
    creator.touch()
    db.add(creator)

    # Update portfolio table if needed
    if portfolio_data:
        from app.domains.portfolio.models import Portfolio
        portfolio_result = await db.exec(
            select(Portfolio).where(Portfolio.creator_id == creator.id)
        )
        portfolio = portfolio_result.first()
        
        if portfolio:
            for field, value in portfolio_data.items():
                setattr(portfolio, field, value)
            portfolio.touch()
            db.add(portfolio)
        else:
            # Create basic portfolio if it doesn't exist yet but user tries updating theme
            new_portfolio = Portfolio(
                creator_id=creator.id,
                slug=creator.subdomain or creator.handle,
                **portfolio_data
            )
            db.add(new_portfolio)

    await db.commit()
    await db.refresh(creator)
    return creator


# ============================================
# Public Services (for subdomain/multi-tenant)
# ============================================

async def get_creator_by_subdomain(db: AsyncSession, subdomain: str) -> Creator | None:
    """Get creator by subdomain. Returns None if not found."""
    result = await db.exec(
        select(Creator).where(Creator.subdomain == subdomain.lower())
    )
    return result.first()


async def get_creator_public_prompts(
    db: AsyncSession,
    creator_id: uuid.UUID,
    limit: int = 50,
    offset: int = 0,
    include_public: bool = True,
):
    """
    Get public prompts for a creator.
    Only returns published prompts that are marked as public.
    """
    from app.domains.prompts.models import Prompt
    from app.common.enums import PromptStatus
    
    query = select(Prompt).where(
        Prompt.creator_id == creator_id,
        Prompt.status == PromptStatus.published,  # Only published
    )
    
    if include_public:
        # Filter for public/open gate type
        from app.common.enums import GateType
        query = query.where(Prompt.gate_type == GateType.open)
    
    query = query.offset(offset).limit(limit)
    
    result = await db.exec(query)
    prompts = result.all()
    
    return [
        {
            "id": str(prompt.id),
            "title": prompt.title,
            "slug": prompt.slug,
            "description": prompt.description,
            "content": prompt.content,
            "thumbnail_url": prompt.thumbnail_url,
            "content_type": prompt.content_type,
            "output_type": prompt.output_type,
            "ai_tool": prompt.ai_tool,
            "category": prompt.category.name if prompt.category else None,
            "view_count": prompt.view_count,
            "created_at": prompt.created_at.isoformat() if prompt.created_at else None,
        }
        for prompt in prompts
    ]