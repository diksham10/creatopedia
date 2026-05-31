# PromptHub — Phasewise Build Plans Index

> **Project:** PromptHub — A prompt discovery site. Admin posts AI-generated reels on Instagram/TikTok, attaches a PromptHub link, visitors click → see embedded reel + exact prompts used → admin earns through ads.
> **Stack:** Next.js 16 (App Router) · React 19 · Tailwind CSS v4 · Supabase · TypeScript  
> **Status:** 🟢 Plans 1–3 Complete — On Plan 4

---

## What Is PromptHub?

Admin posts AI content on Instagram/TikTok and drops a PromptHub link in the caption. Visitors click the link and land on a page showing the embedded reel + the exact prompts, tools, and settings used to create it. Prompts are organized by category (Video Generation, Image Creation, Branding, Education, etc.) and can be browsed on the public landing page. Revenue model: ad impressions.

---

## Phase Execution Order

Prompt each plan file serially in this exact order:

| # | Plan File | Focus Area | Status |
|---|-----------|-----------|--------|
| 1 | [PLAN_01_FOUNDATION.md](./PLAN_01_FOUNDATION.md) | Project setup, deps, env, DB schema, middleware | ✅ Done |
| 2 | [PLAN_02_PUBLIC_PAGE.md](./PLAN_02_PUBLIC_PAGE.md) | Public prompt page, creator bar, prompt gate, oEmbed | ✅ Done |
| 3 | [PLAN_03_ADMIN_AUTH.md](./PLAN_03_ADMIN_AUTH.md) | Supabase Auth, protected admin routes, login page | ✅ Done |
| 4 | [PLAN_04_PROMPT_CRUD.md](./PLAN_04_PROMPT_CRUD.md) | Admin prompt list, create/edit form with **categories**, slug logic | 🔲 Next |
| 5 | [PLAN_05_ANALYTICS.md](./PLAN_05_ANALYTICS.md) | Analytics dashboard, charts, event tracking | ⏳ Pending |
| 6 | [PLAN_06_SETTINGS.md](./PLAN_06_SETTINGS.md) | Creator settings page, avatar upload, branding | ⏳ Pending |
| 7 | [PLAN_07_POLISH.md](./PLAN_07_POLISH.md) | Landing page live prompt data, SEO, error states, final polish | ⏳ Pending |

---

## Key Constraints to Remember

- **Next.js version is 16.2.4** (not 14 as stated in SRS — this is a newer breaking version)
- **React 19** is installed — use Server Components by default
- **Tailwind CSS v4** — config-free, CSS-first approach (no `tailwind.config.js` needed)
- **No component library** — pure Tailwind only
- **Single creator MVP** — no multi-tenant signup yet
- **No Stripe yet** — payment gate is UI stub only
- Read `node_modules/next/dist/docs/` before writing any Next.js-specific code

---

## Environment Variables Required

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
INSTAGRAM_ACCESS_TOKEN=
NEXT_PUBLIC_BASE_DOMAIN=prompthub.app
```
