# Phase 3 — Fix Analytics Overview Page

**Goal:** Fix the existing `/admin/analytics` page. Wire correct data from `analytics_events`. Add date range selector, summary cards, funnel chart.

## Status: ⏳ Pending

---

## Root Cause of 0s

The current `lib/analytics.ts` does a chain:
1. Get prompts → get page_ids → filter `views` by `page_id`
2. `views` table may be empty because ViewTracker was calling `/api/analytics/view` correctly but the `pages` table join had no data.

After Phase 2, data flows correctly into `analytics_events`. Phase 3 replaces `lib/analytics.ts` with a query against the new tables.

---

## New API Route — `GET /api/analytics/overview`

**File:** `app/api/analytics/overview/route.ts` (NEW)

Accepts `?range=7d|14d|30d`. Queries:
- `creator_stats_daily` for summary cards (current + previous period for % change)
- `prompt_stats_daily` for top prompts table
- `ad_campaigns` + `campaign_stats_daily` for top campaigns table
- `analytics_events` for funnel and traffic sources (direct query, not rollup)

Response shape:
```typescript
{
  range: '7d' | '14d' | '30d',
  summary: {
    total_views: number, views_change_pct: number,
    unique_visitors: number, visitors_change_pct: number,
    total_conversions: number, conversions_change_pct: number,
    total_revenue: number, revenue_change_pct: number,
  },
  daily_views: { date: string, views: number, conversions: number }[],
  funnel: {
    views: number,
    gate_attempts: number,    // email_capture events
    successful_unlocks: number, // email_unlock + payment_unlock
    copies: number,
  },
  traffic_sources: { source: string, sessions: number, pct: number }[],
  top_prompts: {
    id: string, title: string, slug: string,
    views: number, unique_views: number, copies: number,
    conv_rate: number, gate_type: string, revenue: number
  }[],
  top_campaigns: {
    id: string, name: string, status: string,
    impressions: number, unique_impressions: number,
    clicks: number, unique_clicks: number,
    ctr: number, frequency: number
  }[]
}
```

---

## Updated `app/(admin)/admin/analytics/page.tsx`

### Changes:
1. **Make it a Client Component** — needs date range state
2. **Remove `getAggregatedStats` import** — use new API
3. **Add `[7D] [14D] [30D]` selector** — matches existing UI tab patterns
4. **Add 4 Summary Cards** with trend arrows (reuse `StatsCard` if possible)
5. **Add Conversion Funnel** — horizontal bars using `AnalyticsChart` or custom
6. **Add Traffic Sources table** — new section
7. **Extend Top Prompts table** — add: Unique Views, Conv Rate, Gate Type, Revenue, `[View Analytics →]` link
8. **Extend Top Campaigns table** — add: Unique Imps, Unique Clicks, Frequency, `[View Details →]` link

### UI Layout:
```
[Date Range Picker: 7D | 14D | 30D]

[Views] [Unique Visitors] [Conversions] [Revenue]  ← 4 summary cards grid

[Daily Views Chart]  [Conversion Funnel]           ← 2-col grid

[Traffic Sources]                                  ← full width table

[Top Prompts ↗]  [Top Campaigns ↗]                ← 2-col grid with detail links
```

---

## Verification Checklist

- [ ] `GET /api/analytics/overview` created and returns correct data
- [ ] Analytics page switches from `getAggregatedStats` to new API
- [ ] Date range selector renders and refetches data on change
- [ ] 4 summary cards show real data with trend %
- [ ] Funnel chart renders
- [ ] Traffic sources table shows referrer breakdown
- [ ] Top prompts table has new columns + `[View Analytics →]` link
- [ ] Top campaigns table has new columns + `[View Details →]` link
