from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select
from sqlalchemy.orm import selectinload
from app.domains.users.models import Creator
from app.domains.portfolio.models import Portfolio
from app.common.exceptions import NotFoundError

async def get_portfolio_by_subdomain(db: AsyncSession, subdomain: str) -> Portfolio:
    # Find the creator with this subdomain
    result = await db.exec(select(Creator).where(Creator.subdomain == subdomain))
    creator = result.first()
    if not creator:
        raise NotFoundError("Creator profile not found")
        
    portfolio_result = await db.exec(
        select(Portfolio)
        .where(Portfolio.creator_id == creator.id)
        .options(
            selectinload(Portfolio.hero),
            selectinload(Portfolio.stats),
            selectinload(Portfolio.works),
            selectinload(Portfolio.creator)
        )
    )
    portfolio = portfolio_result.first()
    
    if not portfolio:
        # If no portfolio structure exists yet, return a basic dynamic representation or raise
        raise NotFoundError("Portfolio is not yet set up")

    return portfolio
