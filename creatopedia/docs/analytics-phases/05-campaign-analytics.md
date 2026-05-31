# Phase 5 — Per-Campaign Analytics Page

**Goal:** Build `/admin/analytics/campaigns/[id]` — deep-dive analytics for a single ad campaign.

## Status: ⏳ Pending

---

## New API Route — `GET /api/analytics/campaigns/[id]`

**File:** `app/api/analytics/campaigns/[id]/route.ts` (NEW)

Accepts `?range=7d|14d|30d`. Verifies campaign belongs to authenticated creator. Queries:
- `campaign_stats_daily` for summary cards
- `campaign_prompt_stats_daily` for placement breakdown table
- `analytics_events` for hourly heatmap (GROUP BY hour, day_of_week WHERE event_type = 'ad_click')
- `analytics_events` for device split and country breakdown
- `analytics_events` for click timeline (last 50, raw events)

Response shape:
```typescript
{
  campaign: { id, name, status, starts_at, ends_at, client_name },
  summary: {
    impressions: number, unique_impressions: number,
    clicks: number, unique_clicks: number,
    ctr: number, frequency: number,
  },
  daily: { date: string, impressions: number, clicks: number }[],
  placement_breakdown: {
    prompt_id, prompt_title, prompt_slug,
    position, impressions, clicks, ctr
  }[],
  device_breakdown: { device: string, count: number, pct: number }[],
  country_breakdown: { country: string, count: number, pct: number }[],
  hourly_heatmap: { hour: number, day: number, clicks: number }[],
  click_timeline: {
    timestamp: string, prompt_title: string, device: string, country: string
  }[]
}
```

---

## New Page — `/admin/analytics/campaigns/[id]/page.tsx`

**File:** `app/(admin)/admin/analytics/campaigns/[id]/page.tsx` (NEW)

### Layout:
```
[← Back to Analytics]

[Campaign Name]  [Client Name]  [status badge]  [Share Report Link button]

[Date Range Picker: 7D | 14D | 30D]

[Impressions] [Unique Imps] [Clicks] [Unique Clicks] [CTR] [Frequency]  ← 6 cards
                                                    "Industry avg CTR: 0.5–2%"

[Performance Chart: bars=impressions, line=clicks]  ← full width

[Placement Breakdown table]  ← full width, sorted by clicks DESC

[Device Split bar chart]  |  [Top Countries list]  |  [Hourly Heatmap]  ← 3-col

[Click Timeline table - last 50]  ← full width
```

### Hourly Heatmap Implementation:
- 7 rows (days) × 24 cols (hours) grid
- Background color intensity = click volume (CSS `opacity` on colored cell)
- Use `grid-cols-24` or inline style for 24-column grid
- Color: `bg-indigo-500` at various opacities

### Share Report Link:
- Button copies `window.location.origin + '/ads/report/' + reportToken` to clipboard
- Show toast "Link copied!"

---

## Verification Checklist

- [ ] `GET /api/analytics/campaigns/[id]` created
- [ ] 401 returned if campaign does not belong to auth user
- [ ] Page renders with 6 summary cards
- [ ] Industry avg CTR benchmark note shown
- [ ] Daily performance chart renders
- [ ] Placement breakdown table renders with links to per-prompt analytics
- [ ] Device, country, heatmap sections render
- [ ] Click timeline table shows last 50 entries
- [ ] Share report link copies correct URL to clipboard
- [ ] `[View Details →]` link from overview page navigates here correctly
