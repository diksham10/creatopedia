# app/domains/analytics/services.py
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select, func
from app.domains.analytics.models import EventLog, AggregatedStat
from app.domains.users.models import Creator
from app.common.enums import EventType
from datetime import date, timedelta
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
            EventLog.created_at >= thirty_days_ago
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
    # Get distinct creators with events on target_date
    result = await db.exec(
        select(EventLog.creator_id)
        .where(func.date(EventLog.created_at) == target_date)
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
                func.date(EventLog.created_at) == target_date,
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