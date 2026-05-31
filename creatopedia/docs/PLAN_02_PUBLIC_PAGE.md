# Phase 2 — Public Prompt Page

> **Run after Phase 1 is complete.** This builds the public-facing creator prompt page.

---

## Objective

Build the SSR public prompt page at `/(public)/[slug]/page.tsx` including:
- `CreatorBar` — avatar, name, handle, social links
- `VideoEmbed` — Instagram oEmbed wrapper with fallback
- `PromptGate` — open / email / payment logic
- `CopyButton` — clipboard copy + PostHog event
- `RelatedPrompts` — 3 other prompts by same creator
- Full Open Graph meta tags
- Instagram oEmbed lib utility

---

## File Structure to Create

```
app/
  (public)/
    [subdomain]/
      [slug]/
        page.tsx        ← SSR server component
components/
  public/
    CreatorBar.tsx
    VideoEmbed.tsx
    PromptGate.tsx
    CopyButton.tsx
    RelatedPrompts.tsx
lib/
  oembed.ts
  analytics.ts
app/
  api/
    email-capture/
      route.ts
    analytics/
      view/route.ts
      event/route.ts
```

---

## Routing Note

Since subdomain middleware rewrites `milan.prompthub.app/photo-enhance` to `/{subdomain}/{slug}`, create the route at:

```
app/(public)/[subdomain]/[slug]/page.tsx
```

The `params` will contain `{ subdomain: 'milan', slug: 'photo-enhance' }`.

---

## Key Components

### `app/(public)/[subdomain]/[slug]/page.tsx`

```tsx
// Server Component — SSR
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import CreatorBar from '@/components/public/CreatorBar'
import VideoEmbed from '@/components/public/VideoEmbed'
import PromptGate from '@/components/public/PromptGate'
import RelatedPrompts from '@/components/public/RelatedPrompts'

export const revalidate = 60 // ISR: revalidate every 60s

export async function generateMetadata({ params }) {
  const { subdomain, slug } = await params
  const supabase = await createClient()
  // fetch creator + prompt, return OG meta
}

export default async function PublicPromptPage({ params }) {
  const { subdomain, slug } = await params
  const supabase = await createClient()
  
  // 1. Fetch creator by subdomain
  const { data: creator } = await supabase
    .from('creators').select('*').eq('subdomain', subdomain).single()
  if (!creator) notFound()

  // 2. Fetch prompt by creator + slug (published only)
  const { data: prompt } = await supabase
    .from('prompts').select('*')
    .eq('creator_id', creator.id).eq('slug', slug).eq('status', 'published').single()
  if (!prompt) notFound()

  // 3. Fetch related prompts (up to 3, excluding current)
  const { data: related } = await supabase
    .from('prompts').select('id,title,slug,ai_tool,output_type,thumbnail_url')
    .eq('creator_id', creator.id).eq('status', 'published').neq('id', prompt.id).limit(3)

  return (
    <main style={{ '--brand': creator.brand_color } as React.CSSProperties}
      className="min-h-screen bg-zinc-950 text-zinc-50">
      <CreatorBar creator={creator} />
      {prompt.video_url && <VideoEmbed url={prompt.video_url} />}
      <section className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-2">{prompt.title}</h1>
        <div className="flex gap-2 mb-4">
          <span className="badge">{prompt.ai_tool}</span>
          <span className="badge">{prompt.output_type}</span>
        </div>
        {prompt.description && <p className="text-zinc-400 mb-6">{prompt.description}</p>}
        <PromptGate prompt={prompt} />
      </section>
      {related && related.length > 0 && (
        <RelatedPrompts prompts={related} subdomain={subdomain} />
      )}
    </main>
  )
}
```

---

### `components/public/PromptGate.tsx`

Client Component (`'use client'`). Three modes:

**OPEN:** Show full content + `CopyButton`

**EMAIL:**
- Show blurred preview (first 80 chars)
- Email input → `POST /api/email-capture` → reveal full content
- Fire PostHog `email_submit` event

**PAYMENT:**
- Show blurred preview
- "Unlock for $X" button → toast "Coming soon"

---

### `components/public/CopyButton.tsx`

```tsx
'use client'
// Uses navigator.clipboard.writeText()
// Shows "Copied!" state for 2 seconds
// Fires PostHog event: { event: 'copy', prompt_id, slug }
```

---

### `lib/oembed.ts`

```typescript
export async function fetchInstagramOEmbed(url: string): Promise<string | null> {
  try {
    const token = process.env.INSTAGRAM_ACCESS_TOKEN
    const endpoint = `https://graph.facebook.com/v18.0/instagram_oembed?url=${encodeURIComponent(url)}&access_token=${token}`
    const res = await fetch(endpoint, { next: { revalidate: 3600 } })
    if (!res.ok) return null
    const data = await res.json()
    return data.html ?? null
  } catch {
    return null
  }
}
```

---

### `lib/analytics.ts`

```typescript
import PostHog from 'posthog-js'

export function trackCopy(promptId: string, slug: string) {
  PostHog.capture('copy', { prompt_id: promptId, slug })
}

export function trackEmailSubmit(promptId: string) {
  PostHog.capture('email_submit', { prompt_id: promptId })
}

export function trackView(pageId: string) {
  PostHog.capture('page_view', { page_id: pageId })
}
```

---

### `app/api/email-capture/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { emailCaptureSchema } from '@/lib/validations'
import { adminClient } from '@/lib/supabase/cli'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const parsed = emailCaptureSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { email, prompt_id } = parsed.data

  // Fetch prompt content
  const { data: prompt } = await adminClient.from('prompts').select('content').eq('id', prompt_id).single()
  if (!prompt) return NextResponse.json({ error: 'Prompt not found' }, { status: 404 })

  // Insert email capture
  await adminClient.from('email_captures').insert({ email, prompt_id })

  return NextResponse.json({ content: prompt.content })
}
```

---

### `app/api/analytics/view/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/cli'

export async function POST(req: NextRequest) {
  const body = await req.json()
  // Fire-and-forget: don't await
  adminClient.from('views').insert(body)
  return NextResponse.json({ ok: true })
}
```

---

## Design Requirements

- Mobile-first (375px base)
- Dark mode: `bg-zinc-950` background
- `--brand` CSS variable from creator's `brand_color` used as accent color
- Creator avatar: rounded full, ring with brand color
- Blurred prompt preview: `blur-sm` + gradient overlay
- Smooth unlock animation when email submitted
- Page must feel premium — not a form page

---

## Validation Checklist

- [ ] `http://localhost:3000/milan/photo-enhance` loads (with subdomain rewrite logic working for local)
- [ ] Creator bar shows avatar, name, handle, social links
- [ ] Open gate shows full prompt immediately
- [ ] Email gate shows blurred preview, email submit unlocks content
- [ ] Payment gate shows "Coming soon" toast
- [ ] Copy button works and shows "Copied!" feedback
- [ ] Related prompts section shows up to 3 cards
- [ ] OG meta tags present (check with `curl -s http://localhost:3000/milan/photo-enhance | grep og:`)
- [ ] `npm run build` passes without errors
