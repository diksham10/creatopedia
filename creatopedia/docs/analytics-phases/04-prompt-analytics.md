# Phase 4 — Per-Prompt Analytics Page

**Goal:** Build `/admin/analytics/prompts/[id]` — deep-dive analytics for a single prompt.

## Status: ⏳ Pending

---

## New API Route — `GET /api/analytics/prompts/[id]`

**File:** `app/api/analytics/prompts/[id]/route.ts` (NEW)

Accepts `?range=7d|14d|30d`. Verifies prompt belongs to authenticated creator. Queries:
- `prompt_stats_daily` for summary cards (current + previous period)
- `analytics_events` for traffic sources (GROUP BY referrer)
- `analytics_events` for device breakdown (GROUP BY device_type)
- `campaign_prompt_stats_daily` for "ads on this page" table
- `email_captures` for email captures table

Response shape:
```typescript
{
  prompt: { id, title, slug, ai_tool, gate_type },
  summary: {
    views: number, views_change_pct: number,
    unique_views: number, unique_views_change_pct: number,
    copies: number, copies_change_pct: number,
    email_captures: number, email_captures_change_pct: number,
    unlocks: number, unlocks_change_pct: number,
    revenue: number, revenue_change_pct: number,
  },
  daily: { date: string, views: number, conversions: number }[],
  funnel: {
    views: number, engaged: number, gate_attempts: number, successful_unlocks: number
  },
  traffic_sources: { source: string, sessions: number, pct: number }[],
  device_breakdown: { device: string, count: number, pct: number }[],
  ads: { campaign_id, campaign_name, impressions, clicks, ctr }[],
  email_captures: { email: string, captured_at: string, source: string }[],
}
```

---

## New Page — `/admin/analytics/prompts/[id]/page.tsx`

**File:** `app/(admin)/admin/analytics/prompts/[id]/page.tsx` (NEW)

### Layout:
```
[← Back to Analytics]

[Prompt Title]  [ai_tool badge]  [gate_type badge]
/{slug}

[Date Range Picker: 7D | 14D | 30D]

[Views] [Unique Views] [Copies] [Email Captures] [Unlocks] [Revenue]  ← 6 cards, 3-col grid

[Conversion Funnel]  [Time Series Chart]  ← 2-col grid

[Traffic Sources table]  |  [Device Breakdown bars]  ← 2-col grid

[Ads on this page table]  ← full width

[Email Captures table]  [Export CSV button]  ← full width
```

### Key implementation notes:
- Fetch prompt metadata and validate creator ownership server-side in page.tsx (not in API)
- Charts reuse `AnalyticsChart` component with `type="bar"` and `type="line"`
- Date range selector = client component wrapper around server-fetched data
- Export CSV: `window.location.href = '/api/analytics/prompts/${id}/export?range=...'` — NOT needed in Phase 4, can be Phase 5

---

## Verification Checklist

- [ ] `GET /api/analytics/prompts/[id]` created
- [ ] 401 returned if prompt does not belong to auth user
- [ ] Page renders with 6 summary cards
- [ ] Funnel chart renders
- [ ] Time series chart renders daily views + conversions
- [ ] Traffic sources and device breakdown tables render
- [ ] Ads table renders
- [ ] Email captures table renders
- [ ] `[View Analytics →]` link from overview page navigates here correctly
