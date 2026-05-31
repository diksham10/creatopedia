# app/domains/analytics/services.py
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select, func
from app.domains.analytics.models import EventLog, AggregatedStat
from app.domains.users.models import Creator
from app.common.enums import EventType
from datetime import date, datetime, timedelta, timezone
import uuid

async def record_event(
    db: AsyncSession,
    event_type: EventType,
    entity_id: uuid.UUID | None,
    entity_type: str | None,
    creator_id: uuid.UUID | None,
    ip: str | None,
    session_id: str | None,
    user_agent: str | None,
    referrer: str | None,
    metadata: dict | None = None,
) -> EventLog:
    event = EventLog(
        event_type=event_type,
        entity_id=entity_id,
        entity_type=entity_type,
        creator_id=creator_id,
        ip_address=ip,
        session_id=session_id,
        user_agent=user_agent,
        referrer=referrer,
        event_metadata=metadata,
    )
    db.add(event)
    await db.commit()
    return event

async def get_overview(db: AsyncSession, creator: Creator) -> dict:
    """Return latest aggregated stats for the creator"""
    today = date.today()
    thirty_days_ago = today - timedelta(days=30)
    # EventLog.created_at is TIMESTAMP — must compare with datetime, not date
    thirty_days_ago_dt = datetime(thirty_days_ago.year, thirty_days_ago.month, thirty_days_ago.day, 0, 0, 0, tzinfo=timezone.utc).replace(tzinfo=None)

    # 1. Get Prompts Created Count
    from app.domains.prompts.models import Prompt
    prompts_result = await db.exec(
        select(func.count(Prompt.id)).where(Prompt.creator_id == creator.id)
    )
    prompts_created = prompts_result.first() or 0

    # 2. Get Portfolio Visits (where event_type=view and entity_type='portfolio')
    # Because this might not be in AggregatedStat yet, we can query EventLog or 
    # we can structure it safely. Assuming EventLog holds recent data.
    portfolio_visits_result = await db.exec(
        select(func.count(EventLog.id)).where(
            EventLog.creator_id == creator.id,
            EventLog.event_type == EventType.view,
            EventLog.entity_type == "portfolio",
            EventLog.created_at >= thirty_days_ago_dt
        )
    )
    portfolio_visits = portfolio_visits_result.first() or 0

    # 3. Get existing rolled-up stats
    result = await db.exec(
        select(
            func.sum(AggregatedStat.prompt_views),
            func.sum(AggregatedStat.prompt_copies),
            func.sum(AggregatedStat.ad_impressions),
            func.sum(AggregatedStat.ad_clicks),
            func.sum(AggregatedStat.email_captures),
        ).where(
            AggregatedStat.creator_id == creator.id,
            AggregatedStat.stat_date >= thirty_days_ago,
        )
    )
    row = result.first()
    
    views = row[0] or 0
    copies = row[1] or 0
    impressions = row[2] or 0
    clicks = row[3] or 0
    captures = row[4] or 0

    # Calculate CTR (Ad Clicks / Ad Impressions)
    ctr = 0.0
    if impressions > 0:
        ctr = round((clicks / impressions) * 100, 2)

    return {
        "total_views": views,
        "prompts_created": prompts_created,
        "profile_visits": portfolio_visits,
        "ctr": ctr,
        "prompt_views": views,
        "prompt_copies": copies,
        "ad_impressions": impressions,
        "ad_clicks": clicks,
        "email_captures": captures,
        "period": "30d",
    }

async def get_daily_chart(db: AsyncSession, creator: Creator, days: int = 30) -> list[dict]:
    """Return time-series data for line charts"""
    start_date = date.today() - timedelta(days=days)
    
    result = await db.exec(
        select(AggregatedStat)
        .where(
            AggregatedStat.creator_id == creator.id,
            AggregatedStat.stat_date >= start_date
        )
        .order_by(AggregatedStat.stat_date)
    )
    
    stats = result.all()
    
    # Fill in blanks for frontend charting convenience
    chart_data = []
    stat_dict = {stat.stat_date: stat for stat in stats}
    
    for i in range(days + 1):
        target = start_date + timedelta(days=i)
        if target in stat_dict:
            stat = stat_dict[target]
            chart_data.append({
                "date": str(target),
                "views": stat.prompt_views,
                "ad_clicks": stat.ad_clicks
            })
        else:
            chart_data.append({
                "date": str(target),
                "views": 0,
                "ad_clicks": 0
            })
            
    return chart_data

async def aggregate_daily(db: AsyncSession, target_date: date) -> int:
    """
    Called by cron job — rolls up EventLog rows into AggregatedStat.
    Returns count of creators processed.
    """
    # Use datetime range to avoid func.date() type issues with asyncpg
    start_dt = datetime(target_date.year, target_date.month, target_date.day, 0, 0, 0)
    end_dt = start_dt + timedelta(days=1)

    # Get distinct creators with events on target_date
    result = await db.exec(
        select(EventLog.creator_id)
        .where(
            EventLog.created_at >= start_dt,
            EventLog.created_at < end_dt,
        )
        .distinct()
    )
    creator_ids = result.all()

    for creator_id in creator_ids:
        if not creator_id:
            continue

        def count_events(event_type: EventType):
            return select(func.count(EventLog.id)).where(
                EventLog.creator_id == creator_id,
                EventLog.event_type == event_type,
                EventLog.created_at >= start_dt,
                EventLog.created_at < end_dt,
            )

        views = (await db.exec(count_events(EventType.view))).first() or 0
        copies = (await db.exec(count_events(EventType.copy))).first() or 0
        impressions = (await db.exec(count_events(EventType.ad_impression))).first() or 0
        clicks = (await db.exec(count_events(EventType.ad_click))).first() or 0
        captures = (await db.exec(count_events(EventType.email_capture))).first() or 0

        # Upsert aggregated stat
        existing = await db.exec(
            select(AggregatedStat).where(
                AggregatedStat.creator_id == creator_id,
                AggregatedStat.stat_date == target_date,
            )
        )
        stat = existing.first()
        if not stat:
            stat = AggregatedStat(creator_id=creator_id, stat_date=target_date)

        stat.prompt_views = views
        stat.prompt_copies = copies
        stat.ad_impressions = impressions
        stat.ad_clicks = clicks
        stat.email_captures = captures
        db.add(stat)

    await db.commit()
    return len(creator_ids)


# ============================================
# Subdomain Multi-Tenant Analytics
# ============================================

async def record_subdomain_visit(
    db: AsyncSession,
    subdomain: str,
    path: str = "/",
    user_email: str | None = None,
    ip_hash: str | None = None,
    user_agent: str | None = None,
) -> str:
    """Record a visit to a creator's subdomain"""
    from app.domains.analytics.models import SubdomainVisit
    from app.domains.users.services import get_creator_by_subdomain
    
    # Get creator by subdomain
    creator = await get_creator_by_subdomain(db, subdomain)
    
    visit = SubdomainVisit(
        subdomain=subdomain.lower(),
        creator_id=creator.id if creator else None,
        path=path,
        user_email=user_email,
        ip_hash=ip_hash,
        user_agent=user_agent,
    )
    db.add(visit)
    await db.commit()
    return str(visit.id)


async def get_subdomain_visit_stats(
    db: AsyncSession,
    subdomain: str,
    days: int = 30,
) -> dict:
    """Get analytics for a subdomain"""
    from app.domains.analytics.models import SubdomainVisit
    
    subdomain_lower = subdomain.lower()
    start_date = datetime.now(timezone.utc) - timedelta(days=days)
    
    # Total visits
    total_result = await db.exec(
        select(func.count(SubdomainVisit.id)).where(
            SubdomainVisit.subdomain == subdomain_lower,
            SubdomainVisit.created_at >= start_date,
        )
    )
    total_visits = total_result.first() or 0
    
    # Unique visitors (by IP hash)
    unique_result = await db.exec(
        select(func.count(func.distinct(SubdomainVisit.ip_hash))).where(
            SubdomainVisit.subdomain == subdomain_lower,
            SubdomainVisit.created_at >= start_date,
        )
    )
    unique_visitors = unique_result.first() or 0
    
    # Last 7 days
    last_7_start = datetime.now(timezone.utc) - timedelta(days=7)
    last_7_result = await db.exec(
        select(func.count(SubdomainVisit.id)).where(
            SubdomainVisit.subdomain == subdomain_lower,
            SubdomainVisit.created_at >= last_7_start,
        )
    )
    last_7_days = last_7_result.first() or 0
    
    # Top paths
    paths_result = await db.exec(
        select(SubdomainVisit.path, func.count(SubdomainVisit.id).label("count"))
        .where(
            SubdomainVisit.subdomain == subdomain_lower,
            SubdomainVisit.created_at >= start_date,
        )
        .group_by(SubdomainVisit.path)
        .order_by(func.count(SubdomainVisit.id).desc())
        .limit(10)
    )
    top_paths = [
        {"path": row[0], "visits": row[1]}
        for row in paths_result.all()
    ]
    
    # Traffic by date
    date_result = await db.exec(
        select(
            func.date(SubdomainVisit.created_at).label("visit_date"),
            func.count(SubdomainVisit.id).label("visits"),
            func.count(func.distinct(SubdomainVisit.ip_hash)).label("unique"),
        )
        .where(
            SubdomainVisit.subdomain == subdomain_lower,
            SubdomainVisit.created_at >= start_date,
        )
        .group_by(func.date(SubdomainVisit.created_at))
        .order_by(func.date(SubdomainVisit.created_at))
    )
    traffic_by_date = [
        {
            "date": str(row[0]),
            "visits": row[1],
            "unique": row[2],
        }
        for row in date_result.all()
    ]
    
    return {
        "subdomain": subdomain_lower,
        "total_visits": total_visits,
        "unique_visitors": unique_visitors,
        "last_7_days": last_7_days,
        "top_paths": top_paths,
        "traffic_by_date": traffic_by_date,
        "period_days": days,
    }