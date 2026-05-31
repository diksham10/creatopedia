# Phase 1 — Foundation: Dependencies, Environment, Database Schema & Middleware

> **Prompt this file first.** Complete this phase before moving to Phase 2.

---

## Objective

Set up the complete project foundation:
1. Install all required npm packages
2. Set up environment variable file
3. Create the Supabase SQL migration (all tables + RLS + indexes)
4. Implement the subdomain-routing middleware
5. Set up `lib/` utilities (supabase client/server, types)
6. Replace the boilerplate `app/page.tsx` with a proper redirect/landing stub
7. Update `next.config.ts` for image domains and wildcard subdomains
8. Create `vercel.json` for wildcard subdomain routing

---

## Step-by-Step Tasks

### 1. Install Dependencies

```bash
npm install @supabase/supabase-js @supabase/ssr zod posthog-js
npm install recharts
npm install --save-dev @types/node
```

> **Note:** Read `node_modules/next/dist/docs/01-app/02-guides/` for middleware and routing patterns before writing code.

---

### 2. Environment File

Create `.env.local` at project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_key
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
INSTAGRAM_ACCESS_TOKEN=your_instagram_token
NEXT_PUBLIC_BASE_DOMAIN=localhost:3000
```

Also create `.env.local.example` (same keys, empty values) for documentation.

---

### 3. Supabase SQL Migration

Create `supabase/migrations/001_initial_schema.sql`:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Creators
CREATE TABLE IF NOT EXISTS creators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  handle TEXT NOT NULL,
  subdomain TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  brand_color TEXT DEFAULT '#6366f1',
  bio TEXT,
  instagram_url TEXT,
  tiktok_url TEXT,
  stripe_id TEXT,
  plan_tier TEXT DEFAULT 'free',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Prompts
CREATE TABLE IF NOT EXISTS prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES creators(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  video_url TEXT,
  thumbnail_url TEXT,
  ai_tool TEXT NOT NULL,
  output_type TEXT NOT NULL,
  gate_type TEXT DEFAULT 'open',
  price DECIMAL(10,2),
  slug TEXT NOT NULL,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(creator_id, slug)
);

-- Pages
CREATE TABLE IF NOT EXISTS pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID REFERENCES prompts(id) ON DELETE CASCADE,
  published_at TIMESTAMPTZ DEFAULT now()
);

-- Views (analytics)
CREATE TABLE IF NOT EXISTS views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID REFERENCES pages(id) ON DELETE CASCADE,
  session_id TEXT,
  referrer TEXT,
  device TEXT,
  country TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Events (copy, unlock, email submit)
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID REFERENCES pages(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  session_id TEXT,
  value TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Email captures
CREATE TABLE IF NOT EXISTS email_captures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID REFERENCES prompts(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  captured_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_prompts_creator ON prompts(creator_id);
CREATE INDEX IF NOT EXISTS idx_prompts_slug ON prompts(slug);
CREATE INDEX IF NOT EXISTS idx_views_page ON views(page_id);
CREATE INDEX IF NOT EXISTS idx_events_page ON events(page_id);

-- RLS Policies
ALTER TABLE creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE views ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_captures ENABLE ROW LEVEL SECURITY;

-- Creators: only authenticated user can read/update their own row
CREATE POLICY "Creator can read own row" ON creators
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Creator can update own row" ON creators
  FOR UPDATE USING (auth.uid() = id);

-- Prompts: creator manages their own; public can read published
CREATE POLICY "Creator manages own prompts" ON prompts
  FOR ALL USING (auth.uid() = creator_id);
CREATE POLICY "Public reads published prompts" ON prompts
  FOR SELECT USING (status = 'published');

-- Pages: public read
CREATE POLICY "Public reads pages" ON pages
  FOR SELECT USING (true);
CREATE POLICY "Service role inserts pages" ON pages
  FOR INSERT WITH CHECK (true);

-- Views: service role writes, no public read
CREATE POLICY "Service role inserts views" ON views
  FOR INSERT WITH CHECK (true);

-- Events: service role writes
CREATE POLICY "Service role inserts events" ON events
  FOR INSERT WITH CHECK (true);

-- Email captures: creator reads their own
CREATE POLICY "Creator reads own captures" ON email_captures
  FOR SELECT USING (
    auth.uid() = (SELECT creator_id FROM prompts WHERE id = prompt_id)
  );
CREATE POLICY "Anyone inserts email capture" ON email_captures
  FOR INSERT WITH CHECK (true);
```

---

### 4. TypeScript Types

Create `types/index.ts`:

```typescript
export type PlanTier = 'free' | 'creator' | 'pro'
export type GateType = 'open' | 'email' | 'payment'
export type PromptStatus = 'draft' | 'published'
export type OutputType = 'image' | 'video' | 'text' | 'code' | 'audio'
export type AiTool = 'Midjourney' | 'Claude' | 'ChatGPT' | 'Gemini' | 'Runway' | 'Pika' | 'Kling' | 'Veo' | 'Other'

export interface Creator {
  id: string
  email: string
  name: string
  handle: string
  subdomain: string
  avatar_url: string | null
  brand_color: string
  bio: string | null
  instagram_url: string | null
  tiktok_url: string | null
  stripe_id: string | null
  plan_tier: PlanTier
  created_at: string
}

export interface Prompt {
  id: string
  creator_id: string
  title: string
  description: string | null
  content: string
  video_url: string | null
  thumbnail_url: string | null
  ai_tool: AiTool
  output_type: OutputType
  gate_type: GateType
  price: number | null
  slug: string
  status: PromptStatus
  created_at: string
}

export interface Page {
  id: string
  prompt_id: string
  published_at: string
}

export interface EmailCapture {
  id: string
  prompt_id: string
  email: string
  captured_at: string
}
```

---

### 5. Supabase Lib Utilities

**`lib/supabase/client.ts`** (browser client):
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**`lib/supabase/server.ts`** (server client for RSC/API routes):
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}
```

**`lib/supabase/admin.ts`** (service role — for server-side inserts bypassing RLS):
```typescript
import { createClient } from '@supabase/supabase-js'

export const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
```

---

### 6. Zod Validation Schemas

Create `lib/validations.ts`:

```typescript
import { z } from 'zod'

export const promptSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  description: z.string().max(500).optional(),
  content: z.string().min(1, 'Prompt content is required'),
  ai_tool: z.enum(['Midjourney', 'Claude', 'ChatGPT', 'Gemini', 'Runway', 'Pika', 'Kling', 'Veo', 'Other']),
  output_type: z.enum(['image', 'video', 'text', 'code', 'audio']),
  gate_type: z.enum(['open', 'email', 'payment']),
  price: z.number().positive().optional().nullable(),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, hyphens only'),
  video_url: z.string().url().optional().nullable().or(z.literal('')),
  status: z.enum(['draft', 'published']),
})

export const emailCaptureSchema = z.object({
  email: z.string().email('Valid email required'),
  prompt_id: z.string().uuid('Invalid prompt ID'),
})

export const creatorSettingsSchema = z.object({
  name: z.string().min(1, 'Name is required').max(60),
  handle: z.string().min(1).regex(/^@?[\w.]+$/).max(30),
  bio: z.string().max(300).optional().nullable(),
  brand_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color'),
  instagram_url: z.string().url().optional().nullable().or(z.literal('')),
  tiktok_url: z.string().url().optional().nullable().or(z.literal('')),
})
```

---

### 7. Middleware (Subdomain Routing)

Create `middleware.ts` at project root:

```typescript
import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(req: NextRequest) {
  const host = req.headers.get('host') ?? ''
  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN ?? 'prompthub.app'
  
  // Strip port for comparison
  const hostWithoutPort = host.split(':')[0]
  const baseWithoutPort = baseDomain.split(':')[0]
  
  const isMainDomain =
    hostWithoutPort === 'www.' + baseWithoutPort ||
    hostWithoutPort === baseWithoutPort ||
    hostWithoutPort === 'localhost' ||
    host === 'localhost:3000'

  // Handle subdomain traffic
  if (!isMainDomain && hostWithoutPort !== 'localhost') {
    const subdomain = hostWithoutPort.split('.')[0]
    const url = req.nextUrl.clone()
    // Rewrite to /[subdomain]/[slug]
    url.pathname = `/${subdomain}${url.pathname}`
    const res = NextResponse.rewrite(url)
    res.headers.set('x-creator-subdomain', subdomain)
    return res
  }

  // Protect /admin routes with Supabase Auth session check
  if (req.nextUrl.pathname.startsWith('/admin')) {
    let response = NextResponse.next({ request: req })
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return req.cookies.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
    
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

---

### 8. Update `next.config.ts`

```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'www.instagram.com',
      },
    ],
  },
}

export default nextConfig
```

---

### 9. Create `vercel.json`

```json
{
  "rewrites": [
    {
      "source": "/:path*",
      "has": [
        {
          "type": "host",
          "value": "(?<subdomain>[^.]+)\\.prompthub\\.app"
        }
      ],
      "destination": "/:path*"
    }
  ]
}
```

---

### 10. Seed Script

Create `scripts/seed.ts`:

```typescript
// Run with: npx ts-node scripts/seed.ts
// Seeds Milan's creator account + 3 sample prompts
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function seed() {
  // 1. Create auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: 'milan@prompthub.app',
    password: 'milan123!',
    email_confirm: true,
  })
  if (authError) { console.error('Auth error:', authError); return }
  
  const userId = authData.user.id

  // 2. Insert creator record
  const { error: creatorError } = await supabase.from('creators').insert({
    id: userId,
    email: 'milan@prompthub.app',
    name: 'Milan Ray',
    handle: '@milanray.design',
    subdomain: 'milan',
    brand_color: '#6366f1',
    bio: 'AI content creator & prompt engineer. Turning ideas into visuals.',
    instagram_url: 'https://instagram.com/milanray.design',
    tiktok_url: 'https://tiktok.com/@milanray.design',
  })
  if (creatorError) { console.error('Creator error:', creatorError); return }

  // 3. Insert sample prompts
  const prompts = [
    {
      creator_id: userId,
      title: 'Cinematic Photo Enhance',
      description: 'Transform any photo into a cinematic masterpiece',
      content: 'Transform this image into a cinematic photograph with dramatic lighting, film grain, anamorphic lens flare, shallow depth of field, golden hour tones, and a 2.39:1 aspect ratio. Style: modern Hollywood blockbuster.',
      ai_tool: 'Midjourney',
      output_type: 'image',
      gate_type: 'open',
      slug: 'photo-enhance',
      status: 'published',
    },
    {
      creator_id: userId,
      title: 'Brand Logo Generator',
      description: 'Generate a premium logo for any brand',
      content: 'Create a minimalist, premium logo for [BRAND NAME] in the [INDUSTRY] space. Style: clean vector, single color, works at 16px and 512px, no text gradients, geometric shapes only. Output: white background SVG style.',
      ai_tool: 'ChatGPT',
      output_type: 'image',
      gate_type: 'email',
      slug: 'brand-logo',
      status: 'published',
    },
    {
      creator_id: userId,
      title: 'Viral Reel Script',
      description: 'Write a viral short-form video script',
      content: 'Write a 30-second viral Instagram Reel script for a [TOPIC] video. Hook (0-3s): bold statement or question. Problem (3-10s): relatable pain point. Solution (10-25s): 3 quick tips. CTA (25-30s): comment trigger word. Tone: conversational, energetic, no fluff.',
      ai_tool: 'Claude',
      output_type: 'text',
      gate_type: 'email',
      slug: 'viral-reel-script',
      status: 'published',
    },
  ]

  const { error: promptsError } = await supabase.from('prompts').insert(prompts)
  if (promptsError) { console.error('Prompts error:', promptsError); return }

  console.log('✅ Seed complete! Creator: milan@prompthub.app / milan123!')
}

seed()
```

---

### 11. Update Root Layout

Update `app/layout.tsx` with proper metadata and Inter font:

```typescript
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: { default: 'PromptHub', template: '%s | PromptHub' },
  description: 'The branded prompt-delivery platform for AI content creators.',
  metadataBase: new URL(`https://${process.env.NEXT_PUBLIC_BASE_DOMAIN}`),
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-zinc-950 text-zinc-50 antialiased">
        {children}
      </body>
    </html>
  )
}
```

---

### 12. Update Global CSS

Update `app/globals.css` for Tailwind v4 (CSS-first, no config file needed):

```css
@import "tailwindcss";

:root {
  --font-inter: 'Inter', sans-serif;
  --brand: #6366f1;
}

* {
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}
```

---

## Validation Checklist

After completing Phase 1, verify:

- [ ] `npm run dev` starts without errors
- [ ] `npm run build` compiles without TypeScript errors
- [ ] `.env.local` exists with all keys populated
- [ ] `lib/supabase/client.ts`, `server.ts`, `admin.ts` exist
- [ ] `lib/validations.ts` exists with all schemas
- [ ] `types/index.ts` exists with all types
- [ ] `middleware.ts` exists at project root
- [ ] `vercel.json` exists
- [ ] `supabase/migrations/001_initial_schema.sql` exists
- [ ] `scripts/seed.ts` exists
- [ ] No ESLint errors (`npm run lint`)

---

## Notes & Gotchas

- **Next.js 16 vs 14:** The SRS mentions Next.js 14, but the installed version is **16.2.4**. Always consult `node_modules/next/dist/docs/` for the correct API.
- **`@supabase/ssr`** must be used (not the old `auth-helpers-nextjs`).
- **Tailwind v4** does not use `tailwind.config.js` — the `@import "tailwindcss"` directive in CSS is the entry point.
- The `cookies()` API from `next/headers` is **async** in Next.js 15+ — always `await` it.
- Keep `SUPABASE_SERVICE_ROLE_KEY` server-side only (never prefix with `NEXT_PUBLIC_`).
