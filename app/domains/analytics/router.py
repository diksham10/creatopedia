# app/domains/analytics/router.py
from fastapi import APIRouter, Depends, Request, Header
from sqlmodel.ext.asyncio.session import AsyncSession
from typing import Optional
from app.core.database import get_db
from app.core.security import get_current_creator
from app.domains.analytics import services
from app.domains.analytics.schemas import EventCreate
from app.domains.users.models import Creator
from app.common.enums import EventType
from app.core.config import settings
from app.common.exceptions import ForbiddenError
from datetime import date

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/overview")
async def overview(
    db: AsyncSession = Depends(get_db),
    creator: Creator = Depends(get_current_creator),
):
    return await services.get_overview(db, creator)

@router.get("/daily")
async def get_daily_stats(
    days: int = 30,
    db: AsyncSession = Depends(get_db),
    creator: Creator = Depends(get_current_creator),
):
    return await services.get_daily_chart(db, creator, days)

@router.post("/view", status_code=202)
async def record_view(
    request: Request,
    data: EventCreate,
    db: AsyncSession = Depends(get_db),
):
    await services.record_event(
        db,
        event_type=EventType.view,
        entity_id=data.entity_id,
        entity_type=data.entity_type,
        creator_id=data.creator_id,
        ip=request.client.host if request.client else None,
        session_id=request.headers.get("x-session-id"),
        user_agent=request.headers.get("user-agent"),
        referrer=request.headers.get("referer"),
    )
    return {"status": "recorded"}

@router.post("/event", status_code=202)
async def record_event(
    request: Request,
    data: EventCreate,
    db: AsyncSession = Depends(get_db),
):
    await services.record_event(
        db,
        event_type=data.event_type,
        entity_id=data.entity_id,
        entity_type=data.entity_type,
        creator_id=data.creator_id,
        ip=request.client.host if request.client else None,
        session_id=request.headers.get("x-session-id"),
        user_agent=request.headers.get("user-agent"),
        referrer=request.headers.get("referer"),
        metadata=data.metadata,
    )
    return {"status": "recorded"}

@router.post("/track", status_code=202)
async def track_event(
    request: Request,
    data: EventCreate,
    db: AsyncSession = Depends(get_db),
):
    """
    General endpoint to record a view, click, or engagement from a public user.
    """
    await services.record_event(
        db,
        event_type=data.event_type or EventType.view,
        entity_id=data.entity_id,
        entity_type=data.entity_type,
        creator_id=data.creator_id,
        ip=request.client.host if request.client else None,
        session_id=request.headers.get("x-session-id"),
        user_agent=request.headers.get("user-agent"),
        referrer=request.headers.get("referer"),
        metadata=data.metadata,
    )
    return {"status": "tracked"}

@router.post("/refresh", status_code=200)
async def manual_refresh(
    db: AsyncSession = Depends(get_db),
    creator: Creator = Depends(get_current_creator),
):
    """
    Manually trigger a background calculation/refresh of stats for today.
    """
    # Simply trigger an aggregate for today
    today = date.today()
    count = await services.aggregate_daily(db, today)
    return {"status": "refreshed", "message": "Daily stats explicitly refreshed"}

@router.post("/cron/aggregate")
async def cron_aggregate(
    db: AsyncSession = Depends(get_db),
    x_cron_secret: Optional[str] = Header(None),
):
    if x_cron_secret != settings.CRON_SECRET:
        raise ForbiddenError("Invalid cron secret")
    yesterday = date.today().replace(day=date.today().day - 1)
    count = await services.aggregate_daily(db, yesterday)
    return {"processed_creators": count, "date": str(yesterday)}