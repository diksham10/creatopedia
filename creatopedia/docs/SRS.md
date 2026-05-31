You are an expert Next.js 14 full-stack developer. Build me a complete 
MVP called **PromptHub** — a branded prompt-delivery platform for AI 
content creators.

---

## CORE CONCEPT
Creators post AI content on Instagram/TikTok. Viewers comment a keyword, 
get a DM with a branded link. That link lands on a beautiful, 
mobile-first prompt page on the creator's subdomain 
(e.g. milan.prompthub.app/photo-enhance).

---

## TECH STACK
- Next.js 14 (App Router)
- Tailwind CSS
- Supabase (PostgreSQL + Auth + Storage)
- Vercel (hosting + wildcard subdomains)
- PostHog (analytics events)
- Zod (validation)
- TypeScript throughout

---

## DATABASE SCHEMA (Supabase / PostgreSQL)

Create these tables with proper foreign keys, indexes, and RLS policies:

\`\`\`sql
-- Creators
CREATE TABLE creators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  handle TEXT NOT NULL,           -- @milanray.design
  subdomain TEXT UNIQUE NOT NULL, -- milan
  avatar_url TEXT,
  brand_color TEXT DEFAULT '#6366f1',
  bio TEXT,
  instagram_url TEXT,
  tiktok_url TEXT,
  stripe_id TEXT,
  plan_tier TEXT DEFAULT 'free',  -- free | creator | pro
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Prompts
CREATE TABLE prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES creators(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL,          -- the actual prompt text
  video_url TEXT,                 -- Instagram/TikTok reel URL
  thumbnail_url TEXT,
  ai_tool TEXT NOT NULL,          -- Midjourney | Claude | ChatGPT | etc.
  output_type TEXT NOT NULL,      -- image | video | text | code
  gate_type TEXT DEFAULT 'open',  -- open | email | payment
  price DECIMAL(10,2),            -- only if gate_type = payment
  slug TEXT NOT NULL,
  status TEXT DEFAULT 'draft',    -- draft | published
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(creator_id, slug)
);

-- Pages (published prompt pages)
CREATE TABLE pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID REFERENCES prompts(id) ON DELETE CASCADE,
  published_at TIMESTAMPTZ DEFAULT now()
);

-- Views (analytics)
CREATE TABLE views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID REFERENCES pages(id) ON DELETE CASCADE,
  session_id TEXT,
  referrer TEXT,
  device TEXT,
  country TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Events (copy, unlock, email submit)
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID REFERENCES pages(id) ON DELETE CASCADE,
  type TEXT NOT NULL,             -- copy | email_submit | unlock
  session_id TEXT,
  value TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Email captures
CREATE TABLE email_captures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID REFERENCES prompts(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  captured_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_prompts_creator ON prompts(creator_id);
CREATE INDEX idx_prompts_slug ON prompts(slug);
CREATE INDEX idx_views_page ON views(page_id);
CREATE INDEX idx_events_page ON events(page_id);
\`\`\`

---

## PROJECT STRUCTURE

\`\`\`
prompthub/
├── app/
│   ├── (admin)/
│   │   ├── layout.tsx              # Admin shell with sidebar
│   │   ├── admin/
│   │   │   ├── page.tsx            # Dashboard home (stats overview)
│   │   │   ├── prompts/
│   │   │   │   ├── page.tsx        # List all prompts
│   │   │   │   ├── new/page.tsx    # Create new prompt
│   │   │   │   └── [id]/page.tsx   # Edit prompt
│   │   │   ├── analytics/
│   │   │   │   └── page.tsx        # Analytics overview
│   │   │   └── settings/
│   │   │       └── page.tsx        # Creator profile & branding
│   ├── (public)/
│   │   └── [slug]/
│   │       └── page.tsx            # Public prompt page (SSR)
│   ├── api/
│   │   ├── prompts/
│   │   │   ├── route.ts            # GET list, POST create
│   │   │   └── [id]/route.ts       # GET one, PATCH, DELETE
│   │   ├── email-capture/
│   │   │   └── route.ts            # POST - save email, return prompt
│   │   ├── analytics/
│   │   │   ├── view/route.ts       # POST - log page view
│   │   │   └── event/route.ts      # POST - log copy/unlock
│   │   └── upload/
│   │       └── route.ts            # POST - upload to Supabase Storage
│   └── layout.tsx
├── components/
│   ├── admin/
│   │   ├── Sidebar.tsx
│   │   ├── PromptForm.tsx          # Reused for create & edit
│   │   ├── PromptTable.tsx
│   │   ├── StatsCard.tsx
│   │   └── AnalyticsChart.tsx
│   └── public/
│       ├── CreatorBar.tsx          # Avatar + name + handle + socials
│       ├── VideoEmbed.tsx          # Instagram oEmbed wrapper
│       ├── PromptGate.tsx          # Handles open/email/payment logic
│       ├── CopyButton.tsx          # Clipboard + PostHog event
│       └── RelatedPrompts.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # Browser client
│   │   └── server.ts               # Server client (for SSR)
│   ├── validations.ts              # Zod schemas for all forms & APIs
│   ├── analytics.ts                # PostHog event helpers
│   └── oembed.ts                   # Instagram oEmbed fetcher
├── middleware.ts                   # Subdomain routing logic
└── types/
    └── index.ts                    # Shared TypeScript types
\`\`\`

---

## MIDDLEWARE (subdomain routing)

\`\`\`typescript
// middleware.ts
// Detect creator subdomain and rewrite to /[slug] public page
// milan.prompthub.app/photo-enhance 
//   → internally routes to /(public)/[slug]/page.tsx
//   → with creator context injected via header

export function middleware(req: NextRequest) {
  const host = req.headers.get('host') ?? ''
  const subdomain = host.split('.')[0]
  
  const isMainDomain = 
    subdomain === 'www' || 
    subdomain === 'prompthub' || 
    subdomain === 'localhost:3000'
  
  if (!isMainDomain) {
    // Pass creator subdomain as header to the page
    const res = NextResponse.rewrite(new URL(req.nextUrl.pathname, req.url))
    res.headers.set('x-creator-subdomain', subdomain)
    return res
  }
}
\`\`\`

---

## SCREENS TO BUILD

### 1. PUBLIC PROMPT PAGE — /(public)/[slug]/page.tsx
Requirements:
- Server-side rendered (SSR) — use async Server Component
- Read x-creator-subdomain header to identify creator
- Fetch creator + prompt data server-side
- Full Open Graph meta tags (title, description, og:image = thumbnail)
- Layout order (mobile-first):
  A. CreatorBar — avatar, name, handle, social links (brand_color accent)
  B. VideoEmbed — Instagram oEmbed, lazy loaded below fold if needed
  C. Prompt title + ai_tool tag + output_type tag
  D. PromptGate component (see below)
  E. RelatedPrompts — 3 other prompts by same creator
- Sub-2-second LCP target
- Cache-Control: public, s-maxage=60, stale-while-revalidate=300

### 2. PROMPT GATE COMPONENT — components/public/PromptGate.tsx
Three modes based on prompt.gate_type:

OPEN:
- Show full prompt text immediately
- CopyButton that copies to clipboard
- Fire PostHog event: { type: 'copy', prompt_id, slug }

EMAIL:
- Show blurred/truncated preview (first 80 chars + blur overlay)
- Email input + "Unlock Free Prompt" button
- On submit: POST /api/email-capture → returns full prompt
- Then show full prompt + CopyButton
- Fire PostHog event: { type: 'email_submit', prompt_id }

PAYMENT (Phase 2 stub — UI only, no Stripe yet):
- Show blurred preview
- "Unlock for $X" button
- Show "Coming soon" toast for now

### 3. ADMIN DASHBOARD — /admin/page.tsx
Stats overview cards:
- Total prompts (published / draft)
- Total page views (last 7 days)
- Total email captures
- Total copy events
Each card shows current value + % change vs previous 7 days.

### 4. PROMPT MANAGEMENT — /admin/prompts/
LIST page:
- Table with: title, ai_tool, gate_type, status, views, copies, created_at
- Actions: Edit, Publish/Unpublish, Delete
- "New Prompt" button → /admin/prompts/new

CREATE/EDIT page (PromptForm.tsx):
Fields:
- title (text input)
- description (textarea)
- content (large textarea — the actual prompt)
- ai_tool (select: Midjourney | Claude | ChatGPT | Gemini | Runway | 
           Pika | Kling | Veo | Other)
- output_type (select: Image | Video | Text | Code | Audio)
- gate_type (radio: Open | Email | Payment)
- price (number input — only shown if gate_type = payment)
- slug (auto-generated from title, editable)
- video_url (text input — paste Instagram/TikTok URL)
- thumbnail (file upload → Supabase Storage via /api/upload)
- status (toggle: Draft / Published)

Validation with Zod. Show field-level errors.
On save: POST /api/prompts (create) or PATCH /api/prompts/[id] (edit)

### 5. ANALYTICS PAGE — /admin/analytics/
- Line chart: daily views last 30 days (use Recharts)
- Bar chart: copies vs email_captures per prompt
- Table: top 5 prompts by views
- Table: top 5 prompts by conversion (copies / views %)
- Recent email captures list (email + prompt + date)

### 6. SETTINGS PAGE — /admin/settings/
Fields:
- name, handle, bio
- avatar upload (→ Supabase Storage)
- brand_color (color picker)
- instagram_url, tiktok_url
- subdomain (read-only for now)
On save: PATCH creator record in Supabase

---

## API ROUTES

### POST /api/email-capture
\`\`\`typescript
// Body: { email: string, prompt_id: string }
// 1. Validate with Zod
// 2. Insert into email_captures table
// 3. Insert event { type: 'email_submit' } into events table
// 4. Return { content: prompt.content }
// Rate limit: 5 requests per IP per hour (use Upstash or simple 
//             in-memory for MVP)
\`\`\`

### POST /api/analytics/view
\`\`\`typescript
// Body: { page_id, session_id, referrer, device, country }
// Fire and forget — don't await, return 200 immediately
// Insert into views table async
\`\`\`

### POST /api/upload
\`\`\`typescript
// Multipart form upload
// Upload to Supabase Storage bucket: 'media'
// Return { url: string }
// Max file size: 5MB
// Allowed types: image/jpeg, image/png, image/webp
\`\`\`

---

## ADMIN AUTH
For Phase 1 (single creator), keep it dead simple:
- Use Supabase Auth (email + password)
- Protect all /admin/* routes via middleware
- No signup page — seed the creator account directly in Supabase

---

## INSTAGRAM OEMBED
\`\`\`typescript
// lib/oembed.ts
// Fetch: https://graph.facebook.com/v18.0/instagram_oembed
//   ?url={reel_url}&access_token={INSTAGRAM_TOKEN}
// Cache the response in Supabase or Next.js fetch cache (1 hour)
// Fallback: if oEmbed fails, show thumbnail image instead
\`\`\`

---

## ENVIRONMENT VARIABLES NEEDED
\`\`\`
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
INSTAGRAM_ACCESS_TOKEN=
NEXT_PUBLIC_BASE_DOMAIN=prompthub.app
\`\`\`

---

## DESIGN REQUIREMENTS
- Mobile-first (375px base)
- Dark mode default (matches creator content aesthetic)
- Use brand_color from creator record as accent throughout public page
- Admin panel: clean, minimal, light or dark toggle
- Font: Inter (already in Next.js)
- No component library — pure Tailwind only
- Public page must look premium, not like a form page

---

## WHAT NOT TO BUILD YET
- Multi-creator signup/onboarding
- Stripe payments
- ManyChat/CreatorFlow webhook integration
- Sponsor/ad system
- Page templates marketplace
- Mobile app

---

## DELIVERABLES
1. Complete working codebase matching the structure above
2. Supabase SQL migration file (all tables + indexes + RLS)
3. Vercel config for wildcard subdomain routing (vercel.json)
4. README with local setup instructions and env var guide
5. Seed script to create Milan's creator account + 3 sample prompts

Build this step by step. Start with: middleware → database → public page → 
admin auth → prompt CRUD → analytics. Ask me before making any major 
architectural decisions not covered in this brief.