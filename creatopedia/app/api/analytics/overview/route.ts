import { NextRequest, NextResponse } from 'next/server'
import { API_BASE_URL } from '@/lib/api/config'
import { AnalyticsOverviewResponse } from '@/lib/analytics/types'

// Helper — build a safe AnalyticsOverviewResponse from whatever the backend returns
function buildSafeResponse(data: Record<string, unknown>): AnalyticsOverviewResponse {
  const summary = {
    total_views: Number(data.total_views ?? data.prompt_views ?? 0),
    views_change_pct: Number(data.views_change_pct ?? 0),
    unique_visitors: Number(data.unique_visitors ?? data.profile_visits ?? 0),
    visitors_change_pct: Number(data.visitors_change_pct ?? 0),
    total_conversions: Number(data.total_conversions ?? data.prompt_copies ?? 0),
    conversions_change_pct: Number(data.conversions_change_pct ?? 0),
    total_revenue: Number(data.total_revenue ?? 0),
    revenue_change_pct: Number(data.revenue_change_pct ?? 0),
  }

  const funnel = {
    views: Number(data.prompt_views ?? data.total_views ?? 0),
    email_submissions: Number(data.email_captures ?? 0),
    prompt_unlocks: Number(data.prompt_copies ?? 0),
    copies: Number(data.prompt_copies ?? 0),
  }

  return {
    range: String(data.period ?? '30d'),
    summary,
    daily_views: Array.isArray(data.daily_views) ? data.daily_views as AnalyticsOverviewResponse['daily_views'] : [],
    funnel,
    traffic_sources: Array.isArray(data.traffic_sources) ? data.traffic_sources as AnalyticsOverviewResponse['traffic_sources'] : [],
    top_prompts: Array.isArray(data.top_prompts) ? data.top_prompts as AnalyticsOverviewResponse['top_prompts'] : [],
    top_campaigns: Array.isArray(data.top_campaigns) ? data.top_campaigns as AnalyticsOverviewResponse['top_campaigns'] : [],
  }
}

export async function GET(req: NextRequest) {
  const cookieHeader = req.headers.get('cookie') || ''
  if (!cookieHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(req.url)
  const qs = url.search

  try {
    // 1. Fetch overview from backend
    const overviewResp = await fetch(
      `${API_BASE_URL.replace(/\/$/, '')}/analytics/overview`,
      {
        headers: {
          cookie: cookieHeader,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      }
    )

    if (!overviewResp.ok) {
      const txt = await overviewResp.text()
      console.error('[analytics/overview] backend error:', overviewResp.status, txt)
      // Return safe empty structure rather than crashing the UI
      return NextResponse.json(
        buildSafeResponse({}),
        { status: 200, headers: { 'Cache-Control': 'no-store' } }
      )
    }

    const rawOverview = await overviewResp.json() as Record<string, unknown>

    // 2. Fetch daily chart data (7 days) to populate daily_views
    let dailyViews: AnalyticsOverviewResponse['daily_views'] = []
    try {
      const dailyResp = await fetch(
        `${API_BASE_URL.replace(/\/$/, '')}/analytics/daily?days=30`,
        {
          headers: { cookie: cookieHeader },
          cache: 'no-store',
        }
      )
      if (dailyResp.ok) {
        const dailyRaw = await dailyResp.json() as { date: string; views: number; ad_clicks?: number }[]
        dailyViews = dailyRaw.map(d => ({
          date: d.date,
          views: d.views ?? 0,
          conversions: d.ad_clicks ?? 0,
        }))
      }
    } catch (_) {
      // non-fatal
    }

    rawOverview.daily_views = dailyViews
    const response = buildSafeResponse(rawOverview)

    return NextResponse.json(response, {
      status: 200,
      headers: { 'Cache-Control': 'private, max-age=60, stale-while-revalidate=300' },
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[analytics/overview] unexpected error:', msg)
    return NextResponse.json(buildSafeResponse({}), { status: 200 })
  }
}
