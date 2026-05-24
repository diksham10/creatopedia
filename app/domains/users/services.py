# app/domains/users/services.py
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select
from app.domains.users.models import Creator
from app.domains.users.schemas import CreatorInitRequest, CreatorUpdateRequest
from app.common.exceptions import ConflictError, NotFoundError
import uuid

async def get_creator_by_id(db: AsyncSession, creator_id: str | uuid.UUID) -> Creator | None:
    result = await db.exec(select(Creator).where(Creator.id == creator_id))
    return result.first()

async def init_creator_profile(
    db: AsyncSession, creator: Creator, data: CreatorInitRequest
) -> Creator:
    if creator.onboarding_complete:
        return creator  # idempotent

    if data.subdomain:
        taken = await db.exec(
            select(Creator).where(
                Creator.subdomain == data.subdomain,
                Creator.id != creator.id
            )
        )
        if taken.first():
            raise ConflictError("Subdomain already taken")
        creator.subdomain = data.subdomain

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
    for field, value in creator_data.items():
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