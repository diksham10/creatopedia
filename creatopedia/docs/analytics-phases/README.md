# Analytics Overhaul — Master Index

## Execution Order

| Phase | File | Status | Description |
|-------|------|--------|-------------|
| 0 | `00-findings.md` | ✅ Done | Codebase analysis report |
| 1 | `01-database-migrations.md` | ⏳ Pending | SQL migrations — run in Supabase SQL Editor |
| 2 | `02-event-tracking.md` | ⏳ Pending | `lib/analytics/track.ts` + wire all event callsites + cron |
| 3 | `03-analytics-overview.md` | ⏳ Pending | Fix existing analytics page + date range + cards + funnel |
| 4 | `04-prompt-analytics.md` | ⏳ Pending | New `/admin/analytics/prompts/[id]` page |
| 5 | `05-campaign-analytics.md` | ⏳ Pending | New `/admin/analytics/campaigns/[id]` page |
| 6 | `06-ad-report-page.md` | ⏳ Pending | Enhance existing `/ads/report/[token]` public page |

---

## Key Decisions

- **PostHog: IGNORED** — key is empty, nothing is initialized. Supabase is the only data source.
- **Dual-write**: Phases 2 keeps writing to old `views`/`events` tables to avoid breakage, and ALSO writes to new `analytics_events`. Old tables can be deprecated after data validates.
- **Rollup tables** are the source of truth for all dashboard display. Raw `analytics_events` is only queried for: click timelines, hourly heatmaps, and traffic source breakdowns.
- **Cron job** runs hourly and aggregates yesterday + today to handle timezone edge cases.
- **Ad report page** (`/ads/report/[token]`) is public with noindex. No auth required. Data comes from `ad_clicks` + `ad_impressions` (not rollup tables yet — raw query is acceptable since this is client-facing, not creator dashboard).

---

## Files That Will Be Created

```
lib/analytics/track.ts                                    NEW
app/api/analytics/overview/route.ts                       NEW
app/api/analytics/prompts/[id]/route.ts                   NEW
app/api/analytics/campaigns/[id]/route.ts                 NEW
app/api/cron/aggregate/route.ts                           NEW
app/(admin)/admin/analytics/prompts/[id]/page.tsx         NEW
app/(admin)/admin/analytics/campaigns/[id]/page.tsx       NEW
```

## Files That Will Be Modified

```
app/api/analytics/event/route.ts                          MODIFY (dual-write)
app/api/analytics/view/route.ts                           MODIFY (dual-write + prompt_id)
app/api/ads/click/route.ts                                MODIFY (also write analytics_events)
app/api/ads/impression/route.ts                           MODIFY (also write analytics_events)
app/api/email-capture/route.ts                            MODIFY (fire email_capture event)
app/api/ads/report/[token]/route.ts                       MODIFY (add unique counts + last clicks)
components/public/ViewTracker.tsx                         MODIFY (add promptId + creatorId props)
app/(public)/[subdomain]/[slug]/page.tsx                  MODIFY (pass props to ViewTracker)
app/(admin)/admin/analytics/page.tsx                      MODIFY (full rewrite of data source)
app/(public)/ads/report/[token]/page.tsx                  MODIFY (add missing sections)
vercel.json                                               MODIFY (add cron entry)
```

---

## Dependency Order

Phase 1 must be done before Phase 2 (tables must exist before tracking writes to them).
Phase 2 must be done before Phase 3 (data must flow before we can display it).
Phases 4, 5, 6 can be done in any order after Phase 3.
