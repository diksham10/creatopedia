# Phase 2 — Unified Event Tracking

**Goal:** Create `lib/analytics/track.ts`, wire `trackEvent` into all missing call sites, add cron job.

## Status: ⏳ Pending

---

## Files to Create

### `lib/analytics/track.ts` (NEW)
Unified fire-and-forget tracker. Reads UA, country, device from request headers.

```typescript
import { adminClient } from '@/lib/supabase/cli'

export type AnalyticsEventType =
  | 'prompt_view'
  | 'prompt_copy'
  | 'email_capture'
  | 'email_unlock'
  | 'payment_unlock'
  | 'pdf_view'
  | 'pdf_download'
  | 'ad_impression'
  | 'ad_click'

export function trackEvent({
  event_type, creator_id, prompt_id, campaign_id,
  placement_id, session_id, value, request,
}: {
  event_type: AnalyticsEventType
  creator_id?: string
  prompt_id?: string
  campaign_id?: string
  placement_id?: string
  session_id: string
  value?: number
  request?: Request | { headers: { get(name: string): string | null } }
}) {
  const ua = request?.headers.get('user-agent') ?? ''
  const country = request?.headers.get('x-vercel-ip-country') ?? null
  const city = request?.headers.get('x-vercel-ip-city') ?? null
  const referrer = request?.headers.get('referer') ?? null
  const device_type = /mobile/i.test(ua) ? 'mobile' : /tablet/i.test(ua) ? 'tablet' : 'desktop'
  const is_valid = !/bot|crawler|spider|headless|phantom|selenium/i.test(ua) && !!session_id

  // Fire and forget — never await this
  adminClient.from('analytics_events').insert({
    event_type,
    creator_id: creator_id ?? null,
    prompt_id: prompt_id ?? null,
    campaign_id: campaign_id ?? null,
    placement_id: placement_id ?? null,
    session_id,
    referrer,
    device_type,
    country,
    city,
    value: value ?? null,
    is_valid,
  }).then()
}
```

---

## Files to Modify

### `app/api/analytics/event/route.ts` (MODIFY)
Currently inserts to old `events` table. Add `analytics_events` write alongside existing one to avoid breaking ViewTracker data.

```typescript
// ADD alongside existing insert:
import { trackEvent } from '@/lib/analytics/track'

export async function POST(req: NextRequest) {
  const body = await req.json()
  
  // Keep old insert for backward compat
  adminClient.from('events').insert(body)
  
  // New unified tracking
  if (body.prompt_id && body.session_id) {
    trackEvent({
      event_type: body.type === 'copy' ? 'prompt_copy' : body.type,
      prompt_id: body.prompt_id,
      session_id: body.session_id,
      request: req,
    })
  }
  
  return NextResponse.json({ ok: true })
}
```

### `app/api/analytics/view/route.ts` (MODIFY)
Currently inserts to old `views` table. Also write to `analytics_events`.

```typescript
// Also call trackEvent for prompt_view
import { trackEvent } from '@/lib/analytics/track'

export async function POST(req: NextRequest) {
  const body = await req.json()
  adminClient.from('views').insert(body) // keep old
  
  // Write to new unified table
  if (body.prompt_id && body.session_id) {
    trackEvent({
      event_type: 'prompt_view',
      creator_id: body.creator_id ?? undefined,
      prompt_id: body.prompt_id,
      session_id: body.session_id,
      request: req,
    })
  }
  
  return NextResponse.json({ ok: true })
}
```

**NOTE:** ViewTracker needs to pass `prompt_id` and `creator_id`. Currently it only sends `page_id`. Two options:
1. Pass `prompt_id` as a new prop to ViewTracker (preferred — see below)
2. Look up prompt_id from page_id server-side

**Chosen approach: Pass `prompt_id` and `creator_id` to ViewTracker.**

### `components/public/ViewTracker.tsx` (MODIFY)
Add `promptId` and `creatorId` props. Send them in the POST body.

```typescript
interface Props {
  pageId: string
  promptId?: string
  creatorId?: string
}

// In the fetch body:
body: JSON.stringify({
  page_id: pageId,
  prompt_id: promptId,
  creator_id: creatorId,
  session_id: sessionId,
  referrer: document.referrer,
  device: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
}),
```

### `app/(public)/[subdomain]/[slug]/page.tsx` (MODIFY)
Pass `promptId` and `creatorId` to ViewTracker:

```tsx
{pageId && (
  <ViewTracker
    pageId={pageId}
    promptId={prompt.id}
    creatorId={creator.id}
  />
)}
```

### `app/api/email-capture/route.ts` (MODIFY)
Fire `email_capture` event after inserting. Also fire `email_unlock` since successful email submit = unlock.

```typescript
import { trackEvent } from '@/lib/analytics/track'

// After insert, fire-and-forget:
const sessionId = req.headers.get('x-session-id') ?? 'unknown'
trackEvent({
  event_type: 'email_capture',
  prompt_id,
  session_id: sessionId,
  request: req,
})
trackEvent({
  event_type: 'email_unlock',
  prompt_id,
  session_id: sessionId,
  request: req,
})
```

**NOTE:** The frontend PromptGate must send `x-session-id` header with the POST to `/api/email-capture`.

### `app/api/ads/click/route.ts` (MODIFY)
Already logs to `ad_clicks`. Also write to `analytics_events`:

```typescript
import { trackEvent } from '@/lib/analytics/track'

// After existing ad_clicks insert:
const sessionId = searchParams.get('session_id') ?? 'unknown'
trackEvent({
  event_type: 'ad_click',
  campaign_id: campaignId,
  placement_id: placementId ?? undefined,
  prompt_id: promptId ?? undefined,
  session_id: sessionId,
  request: req,
})
```

### `app/api/ads/impression/route.ts` (MODIFY)
Already logs to `ad_impressions`. Also write to `analytics_events`:

```typescript
import { trackEvent } from '@/lib/analytics/track'

trackEvent({
  event_type: 'ad_impression',
  campaign_id,
  placement_id,
  prompt_id: prompt_id ?? undefined,
  session_id: session_id ?? 'unknown',
  request: req,
})
```

---

## New API Route

### `POST /api/analytics/event` — Already Exists
No new route needed. The existing one will be extended.

---

## New Cron Route

### `app/api/cron/aggregate/route.ts` (NEW)

```typescript
import { NextRequest } from 'next/server'
import { adminClient } from '@/lib/supabase/cli'

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

  await adminClient.rpc('aggregate_daily_stats', { target_date: today })
  await adminClient.rpc('aggregate_daily_stats', { target_date: yesterday })

  return Response.json({ ok: true, ran_at: new Date().toISOString() })
}
```

### `vercel.json` — Add cron entry

```json
{
  "crons": [
    { "path": "/api/cron/aggregate", "schedule": "0 * * * *" }
  ]
}
```

---

## Verification Checklist

- [ ] `lib/analytics/track.ts` created
- [ ] `api/analytics/event/route.ts` writes to `analytics_events`
- [ ] `api/analytics/view/route.ts` writes to `analytics_events`
- [ ] `ViewTracker` sends `prompt_id` + `creator_id`
- [ ] `api/email-capture/route.ts` fires `email_capture` + `email_unlock`
- [ ] `api/ads/click/route.ts` writes to `analytics_events`
- [ ] `api/ads/impression/route.ts` writes to `analytics_events`
- [ ] Cron route created at `/api/cron/aggregate`
- [ ] `vercel.json` updated with cron schedule
- [ ] `CRON_SECRET` in `.env.local`
