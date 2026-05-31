# Codebase Analysis Report — Analytics Overhaul

## POSTHOG STATUS
- `NEXT_PUBLIC_POSTHOG_KEY` exists in `.env.local` but is **empty** (`NEXT_PUBLIC_POSTHOG_KEY=`)
- No `posthog.init()` call found anywhere in the codebase
- No `posthog.capture()` calls found anywhere
- Session IDs are stored as `ph_sid` in sessionStorage (legacy naming from a removed PostHog setup)

**Decision: PostHog is ignored. Supabase is the single source of truth. `ph_sid` session key is kept as-is to avoid breaking ViewTracker.**

---

## EXISTING TABLES (queried by current analytics code)

The current `lib/analytics.ts` queries these tables:
- `views` — page view events (via `/api/analytics/view` → inserts `page_id, session_id, referrer, device`)
- `events` — generic events (via `/api/analytics/event` → inserts `page_id, type, session_id, value`)
- `email_captures` — email gate conversions
- `pages` — maps prompt_id → page_id
- `ad_impressions` — ad impression records (`campaign_id, placement_id, prompt_id, session_id, device, referrer`)
- `ad_clicks` — ad click records (`campaign_id, placement_id, prompt_id, device`)
- `ad_campaigns` — campaign master data
- `prompts` — prompt master data

**Missing tables (need to create):**
- `analytics_events` — unified event store
- `prompt_stats_daily` — daily rollup per prompt
- `campaign_stats_daily` — daily rollup per campaign
- `campaign_prompt_stats_daily` — daily rollup per campaign×prompt
- `creator_stats_daily` — daily rollup per creator
- `aggregate_daily_stats` SQL function (cron target)

---

## WHY ANALYTICS SHOWS 0s EVERYWHERE

1. `lib/analytics.ts` queries `views` table via join through `pages` table  
2. `ViewTracker` sends events to `/api/analytics/view` which inserts into `views`  
3. BUT: `views` and `pages` tables may be empty or the join (`in('page_id', pageIds)`) returns 0 rows because `pages` table has no matching records for the creator's prompts  
4. `ad_impressions` / `ad_clicks` data was empty until recently (reseed was done in previous session)
5. The analytics page has NO date range selector — it's hardcoded to 7 days for views but 30 days for email captures (inconsistent)

---

## AD SYSTEM STATUS

| Item | Status |
|------|--------|
| `ad_campaigns` table | ✅ Exists |
| `ad_placements` table | ✅ Exists (category_id column added in previous session) |
| `ad_clicks` table | ✅ Exists |
| `ad_impressions` table | ✅ Exists |
| `ad_clients` table | ✅ Exists |
| `AdBanner` component | ✅ Built (IntersectionObserver, fires `/api/ads/impression`) |
| `/api/ads/click` route | ✅ Built (logs click, fires webhook, 302 redirects with UTM) |
| `/api/ads/impression` route | ✅ Built |
| `/api/ads/report/[token]` API | ✅ Built (queries raw `ad_impressions` + `ad_clicks`) |
| `/ads/report/[token]` public page | ✅ Built (full UI already exists) |

---

## EVENT TRACKING STATUS

| Event | Status | Gap |
|-------|--------|-----|
| `prompt_view` | ⚠️ Partial | `ViewTracker` sends to `views` table (old schema), not `analytics_events` |
| `prompt_copy` | ⚠️ Partial | `CopyButton` calls `trackCopy()` → `/api/analytics/event` → inserts into `events` table (old schema) |
| `email_capture` | ❌ Missing | `/api/email-capture` inserts to `email_captures` but no analytics event fired |
| `email_unlock` | ❌ Missing | No tracking of successful unlock |
| `payment_unlock` | ❌ Missing | No payment webhook exists |
| `pdf_view` | ❌ Missing | |
| `pdf_download` | ❌ Missing | |
| `ad_impression` | ✅ Exists | `AdBanner` fires to `/api/ads/impression` → `ad_impressions` table |
| `ad_click` | ✅ Exists | `/api/ads/click` inserts into `ad_clicks` table |

---

## PAGES THAT EXIST

| Page | Status |
|------|--------|
| `/admin/analytics` | ✅ Exists (broken — shows 0s) |
| `/admin/analytics/prompts/[id]` | ❌ Does not exist |
| `/admin/analytics/campaigns/[id]` | ❌ Does not exist |
| `/ads/report/[token]` | ✅ Exists (public page with full UI) |

---

## API ROUTES STATUS

| Route | Status |
|-------|--------|
| `GET /api/analytics/stats` | ✅ Exists (uses old `lib/analytics.ts` — broken) |
| `POST /api/analytics/event` | ✅ Exists (writes to old `events` table) |
| `POST /api/analytics/view` | ✅ Exists (writes to old `views` table) |
| `GET /api/analytics/overview` | ❌ Does not exist |
| `GET /api/analytics/prompts/[id]` | ❌ Does not exist |
| `GET /api/analytics/campaigns/[id]` | ❌ Does not exist |
| `GET /api/cron/aggregate` | ❌ Does not exist |
| `POST /api/analytics/event` (unified) | ✅ Exists but uses old schema |

---

## KEY PATTERNS OBSERVED

- All admin pages are in `app/(admin)/admin/`
- All API routes use `adminClient` from `lib/supabase/admin.ts` for write ops
- Auth uses `createClient` from `utils/supabase/server.ts`
- Components use dark zinc palette (`bg-zinc-900`, `border-zinc-800`)
- Charts use `AnalyticsChart` component (Recharts-based in `components/admin/AnalyticsChart.tsx`)
- Tables follow the section/thead/tbody pattern with `divide-y divide-zinc-800`
- Fire-and-forget pattern: `adminClient.from(...).insert(...).then()`
