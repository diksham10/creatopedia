# app/domains/analytics/router.py
from fastapi import APIRouter, Depends, Request, Header
from sqlmodel.ext.asyncio.session import AsyncSession
from typing import Optional
from pydantic import BaseModel
from app.core.database import get_db
from app.core.security import get_current_creator, get_optional_creator
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


# ============================================
# Subdomain Multi-Tenant Analytics (Public)
# ============================================

public_router = APIRouter(prefix="/analytics", tags=["Analytics (Public)"])


class SubdomainVisitCreate(BaseModel):
    subdomain: str
    path: Optional[str] = "/"
    user_email: Optional[str] = None
    ip_hash: Optional[str] = None
    user_agent: Optional[str] = None


@public_router.post("/track-subdomain-visit", status_code=202)
async def track_subdomain_visit(
    request: Request,
    payload: SubdomainVisitCreate | None = None,
    subdomain: Optional[str] = None,
    path: Optional[str] = "/",
    user_email: Optional[str] = None,
    ip_hash: Optional[str] = None,
    user_agent: Optional[str] = None,
    x_internal_secret: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
    creator: Creator = Depends(get_optional_creator),
):
    """
    Track a visit to a creator's subdomain.
    
    This endpoint is called by the Next.js frontend to record subdomain visits.
    For production, requires X-Internal-Secret header.
    
    Query/Body Parameters:
    - subdomain: Creator subdomain (e.g., "john")
    - path: Page path visited (default: "/")
    - user_email: Optional visitor email
    - ip_hash: Base64-encoded hash of IP + User-Agent
    - user_agent: Visitor's user agent string
    """
    if payload:
        subdomain = payload.subdomain or subdomain
        path = payload.path or path
        user_email = payload.user_email or user_email
        ip_hash = payload.ip_hash or ip_hash
        user_agent = payload.user_agent or user_agent

    # Verify internal secret in production. If not an internal call, require
    # authentication and verify ownership of the subdomain.
    internal_ok = False
    if getattr(settings, "INTERNAL_API_SECRET", None) and x_internal_secret:
        if x_internal_secret == settings.INTERNAL_API_SECRET:
            internal_ok = True
            # Optional IP allowlist (comma-separated) to further restrict callers.
            allowlist = getattr(settings, "INTERNAL_API_ALLOWLIST", None)
            if allowlist:
                allowed_ips = [ip.strip() for ip in allowlist.split(",") if ip.strip()]
                client_ip = request.client.host if request.client else None
                if client_ip not in allowed_ips:
                    raise ForbiddenError("Invalid internal request origin")

    if not internal_ok:
        if not creator:
            raise ForbiddenError("Authentication required to record subdomain visits")
        if creator.subdomain != subdomain:
            raise ForbiddenError("You do not have permission to record visits for this subdomain")

    # Use verified email from JWT when available; ignore any provided `user_email`.
    effective_user_email = creator.email if creator else None

    visit_id = await services.record_subdomain_visit(
        db,
        subdomain=subdomain,
        path=path or "/",
        user_email=effective_user_email,
        ip_hash=ip_hash,
        user_agent=user_agent,
    )
    
    return {
        "success": True,
        "visit_id": visit_id,
    }


@public_router.get("/subdomain-visits")
async def get_subdomain_visits(
    request: Request,
    subdomain: str,
    days: int = 30,
    x_internal_secret: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
    creator: Creator = Depends(get_optional_creator),
):
    """
    Get analytics for a creator's subdomain.
    
    Query Parameters:
    - subdomain: Creator subdomain
    - days: Number of days to include in stats (default: 30)
    
    Returns:
    - total_visits: Total visits in period
    - unique_visitors: Unique visitor fingerprints
    - traffic_by_date: Daily breakdown
    - top_paths: Most visited paths
    - last_7_days: Visits in last 7 days
    """
    # Verify internal secret in production. If not an internal call, require
    # authentication and verify ownership of the subdomain.
    internal_ok = False
    if getattr(settings, "INTERNAL_API_SECRET", None) and x_internal_secret:
        if x_internal_secret == settings.INTERNAL_API_SECRET:
            internal_ok = True
            allowlist = getattr(settings, "INTERNAL_API_ALLOWLIST", None)
            if allowlist:
                allowed_ips = [ip.strip() for ip in allowlist.split(",") if ip.strip()]
                client_ip = request.client.host if request.client else None
                if client_ip not in allowed_ips:
                    raise ForbiddenError("Invalid internal request origin")

    if not internal_ok:
        if not creator:
            raise ForbiddenError("Authentication required to access analytics for subdomains")
        if creator.subdomain != subdomain:
            raise ForbiddenError("You do not have permission to access analytics for this subdomain")

    stats = await services.get_subdomain_visit_stats(
        db,
        subdomain=subdomain,
        days=days,
    )

    return stats