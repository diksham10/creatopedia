from fastapi import APIRouter, Depends
from sqlmodel.ext.asyncio.session import AsyncSession
from app.core.database import get_db
from app.domains.portfolio import schemas, services

router = APIRouter(prefix="/api/users", tags=["Portfolio / Users Public"])

@router.get("/{subdomain}", response_model=schemas.PortfolioPublicOut)
async def get_public_profile(subdomain: str, db: AsyncSession = Depends(get_db)):
    """
    Fetches the public profile / portfolio details based on a subdomain (or handle).
    """
    portfolio = await services.get_portfolio_by_subdomain(db, subdomain)
    return portfolio
