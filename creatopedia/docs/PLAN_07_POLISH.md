# Phase 7 — Polish, SEO & Final Checks

> **Run after Phase 6 is complete.** This is the final phase before deploy.

---

## Objective

- Full SEO meta tags on all public pages
- Error and loading states everywhere
- Performance optimizations (caching, image optimization)
- `not-found.tsx` and `error.tsx` pages
- Admin dashboard stats fully wired (views + copy events)
- Final `npm run build` with zero errors/warnings
- README update with setup instructions

---

## Tasks

### 1. SEO — Public Prompt Page

Ensure `generateMetadata` in `app/(public)/[subdomain]/[slug]/page.tsx` returns full OG tags:

```typescript
export async function generateMetadata({ params }): Promise<Metadata> {
  const { subdomain, slug } = await params
  // fetch creator + prompt
  return {
    title: `${prompt.title} by ${creator.name}`,
    description: prompt.description ?? `${prompt.ai_tool} prompt by ${creator.name}`,
    openGraph: {
      title: `${prompt.title} | PromptHub`,
      description: prompt.description ?? '',
      images: prompt.thumbnail_url ? [{ url: prompt.thumbnail_url }] : [],
      type: 'website',
      url: `https://${subdomain}.prompthub.app/${slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${prompt.title} | PromptHub`,
      description: prompt.description ?? '',
      images: prompt.thumbnail_url ? [prompt.thumbnail_url] : [],
    },
  }
}
```

---

### 2. Not Found & Error Pages

**`app/not-found.tsx`** (global 404):
```tsx
export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 text-zinc-50">
      <h1 className="text-6xl font-bold text-zinc-700">404</h1>
      <p className="text-zinc-400 mt-4">This prompt page doesn't exist.</p>
      <a href="/" className="mt-6 text-indigo-400 hover:text-indigo-300">Go home →</a>
    </div>
  )
}
```

**`app/error.tsx`** (global error boundary — must be client component):
```tsx
'use client'
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 text-zinc-50">
      <h2 className="text-2xl font-bold">Something went wrong</h2>
      <p className="text-zinc-400 mt-2">{error.message}</p>
      <button onClick={reset} className="mt-6 px-4 py-2 bg-indigo-600 rounded-lg">Try again</button>
    </div>
  )
}
```

**`app/loading.tsx`** (global loading state):
```tsx
export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
```

---

### 3. Wire Up Admin Dashboard Stats

In `app/(admin)/admin/page.tsx`, replace stubs with real data:

```typescript
// Views in last 7 days
const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
const { count: viewsCount } = await supabase
  .from('views').select('*', { count: 'exact', head: true })
  .gte('created_at', sevenDaysAgo)

// Copy events in last 7 days
const { count: copiesCount } = await supabase
  .from('events').select('*', { count: 'exact', head: true })
  .eq('type', 'copy').gte('created_at', sevenDaysAgo)
```

---

### 4. PostHog Setup

Initialize PostHog in a client Provider:

**`components/PostHogProvider.tsx`:**
```tsx
'use client'
import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'
import { useEffect } from 'react'

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      capture_pageview: false, // manual pageview tracking
    })
  }, [])
  return <PHProvider client={posthog}>{children}</PHProvider>
}
```

Wrap `app/layout.tsx` body with `<PostHogProvider>`.

---

### 5. Performance Checklist

- [ ] All images use `<Image />` from `next/image` with explicit `width`/`height`
- [ ] Public page has `export const revalidate = 60` (ISR)
- [ ] oEmbed fetches cached via `next: { revalidate: 3600 }`
- [ ] Analytics view fires fire-and-forget (no await on server)
- [ ] `Cache-Control: public, s-maxage=60, stale-while-revalidate=300` on public page responses

---

### 6. Update README.md

Replace default README with:

```markdown
# PromptHub

A branded prompt-delivery platform for AI content creators.

## Local Setup

1. Clone the repo
2. `npm install`
3. Copy `.env.local.example` → `.env.local` and fill in all values
4. Run the SQL migration in Supabase: `supabase/migrations/001_initial_schema.sql`
5. Create the `media` storage bucket in Supabase (public access)
6. Run seed script: `npx ts-node scripts/seed.ts`
7. `npm run dev` → open http://localhost:3000

## Admin Login (after seeding)

- Email: `milan@prompthub.app`
- Password: `milan123!`

## Subdomain Testing Locally

Add to `/etc/hosts`:
```
127.0.0.1 milan.localhost
```
Then visit: `http://milan.localhost:3000/photo-enhance`

## Deployment (Vercel)

1. Connect repo to Vercel
2. Add all env vars in Vercel dashboard
3. Configure wildcard domain: `*.prompthub.app` → your Vercel project
```

---

### 7. Final Build Verification

```bash
# Run these in order — all must pass:
npm run lint
npm run build
```

Fix **every** TypeScript error and ESLint warning before considering Phase 7 done.

---

## Final Validation Checklist

- [ ] `npm run lint` — zero errors
- [ ] `npm run build` — zero errors
- [ ] Public prompt page renders with correct OG tags
- [ ] 404 page shows for unknown slugs
- [ ] Error boundary catches and displays errors gracefully
- [ ] Loading spinner shows during navigation
- [ ] Admin dashboard shows real view/copy counts
- [ ] PostHog events fire on copy and email submit
- [ ] README has complete setup instructions
- [ ] `.env.local.example` exists with all keys (empty values)
- [ ] `vercel.json` is correct for wildcard subdomain routing

---

## What's NOT Built (Phase 2 — Future)

Per the SRS, these are explicitly out of scope for MVP:
- Multi-creator signup/onboarding flow
- Stripe payment integration
- ManyChat/CreatorFlow webhook
- Sponsor/ad system
- Page templates marketplace
- Mobile app
