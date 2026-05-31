# Portfolio System — Database Architecture & Schema Design

> **Status:** Ready to apply in Supabase SQL Editor  
> **Depends on:** `001_initial_schema.sql`, `002_ad_system.sql`, and all subsequent migrations being applied first.

---

## Architecture Overview

```
auth.users (Supabase built-in)
    │
    └──► creators  (1:1, id = auth.uid())
              │
              └──► portfolios   (1:1 per creator, the portfolio "meta")
                        │
                        ├──► portfolio_hero        (1:1)
                        ├──► portfolio_stats       (1:N — multiple stat items)
                        ├──► portfolio_journey     (1:N — timeline steps)
                        ├──► portfolio_works       (1:N — project cards)
                        ├──► portfolio_impact      (1:N — value prop cards)
                        ├──► portfolio_testimonials(1:N — client quotes)
                        └──► portfolio_brands      (1:N — collaborated brand logos)

inquiries (multi-source)
    ├── source = 'creatopedia_landing'  →  from the main Creatopedia waitlist/reach-us pages
    └── source = 'portfolio_contact'   →  from individual creator portfolio /contact form
```

### Key Design Decisions

| Decision | Rationale |
|---|---|
| `portfolios` is a separate table (not embedded in `creators`) | Allows optional portfolio creation, clean separation of concerns, and portfolio-level settings (published/draft, theme, SEO). |
| Each section is its own table | Enables independent ordering, soft deletes, partial saves, and future extensions without schema churn. |
| `sort_order` on every section row | Enables drag-and-drop reordering in future admin UI. |
| Unified `inquiries` table with `source` column | Keeps all leads in one queryable place. Avoids table proliferation. |
| `portfolios.creator_id` FK → `creators.id` | One-to-one. `UNIQUE(creator_id)` enforced at DB level. |
| `published BOOLEAN` on `portfolios` | Creator works in draft mode and publishes when ready. |
| `updated_at` triggers on all tables | Standard audit trail via a reusable trigger function. |
| RLS on every table | Creators manage only their own data; public reads published portfolios; anyone inserts inquiries. |

---

## MIGRATION: `20260508_portfolio_system.sql`

Save to `/supabase/migrations/20260508_portfolio_system.sql` and run in Supabase SQL Editor.

```sql
-- ============================================================
-- 20260508_portfolio_system.sql
-- Dynamic Portfolio System for Creatopedia creators
-- ============================================================

-- ── 1. PORTFOLIOS (Root / meta table) ────────────────────────
CREATE TABLE IF NOT EXISTS portfolios (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id       UUID REFERENCES creators(id) ON DELETE CASCADE NOT NULL,
  published        BOOLEAN DEFAULT false,
  slug             TEXT,
  seo_title        TEXT,
  seo_description  TEXT,
  theme_color      TEXT DEFAULT '#ff1f4b',
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT portfolios_creator_id_unique UNIQUE (creator_id)
);

-- ── 2. PORTFOLIO HERO ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS portfolio_hero (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id          UUID REFERENCES portfolios(id) ON DELETE CASCADE NOT NULL,
  headline              TEXT NOT NULL DEFAULT '',
  subheadline           TEXT DEFAULT '',
  tagline               TEXT DEFAULT '',
  image_url             TEXT,
  cta_primary_label     TEXT DEFAULT 'Explore My Work',
  cta_primary_url       TEXT DEFAULT '#works',
  cta_secondary_label   TEXT DEFAULT 'Let''s Talk',
  cta_secondary_url     TEXT DEFAULT '#contact',
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT portfolio_hero_portfolio_id_unique UNIQUE (portfolio_id)
);

-- ── 3. PORTFOLIO STATISTICS ───────────────────────────────────
CREATE TABLE IF NOT EXISTS portfolio_stats (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id     UUID REFERENCES portfolios(id) ON DELETE CASCADE NOT NULL,
  label            TEXT NOT NULL,    -- e.g. "Prompt Runs", "Happy Users"
  value            TEXT NOT NULL,    -- e.g. "1.2M+", "99.9%"
  sort_order       INTEGER DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

-- ── 4. PORTFOLIO JOURNEY ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS portfolio_journey (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id     UUID REFERENCES portfolios(id) ON DELETE CASCADE NOT NULL,
  chapter          TEXT NOT NULL,       -- e.g. "Chapter I (2022)"
  title            TEXT NOT NULL,       -- e.g. "The AI Genesis & Discovery"
  description      TEXT NOT NULL,
  year             TEXT,
  align            TEXT DEFAULT 'right',  -- 'left' | 'right'
  sort_order       INTEGER DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

-- ── 5. PORTFOLIO WORKS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS portfolio_works (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id     UUID REFERENCES portfolios(id) ON DELETE CASCADE NOT NULL,
  title            TEXT NOT NULL,
  category         TEXT NOT NULL,         -- e.g. "AI Art & Midjourney"
  description      TEXT,
  image_url        TEXT,
  tags             TEXT[] DEFAULT '{}',   -- e.g. ['Midjourney v6', 'Cinematic']
  link_url         TEXT,
  featured         BOOLEAN DEFAULT false,
  sort_order       INTEGER DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

-- ── 6. PORTFOLIO IMPACT (Value Props) ─────────────────────────
CREATE TABLE IF NOT EXISTS portfolio_impact (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id     UUID REFERENCES portfolios(id) ON DELETE CASCADE NOT NULL,
  title            TEXT NOT NULL,         -- e.g. "Hyper-Targeted Outputs"
  description      TEXT,
  icon_name        TEXT DEFAULT 'target', -- Lucide icon name
  sort_order       INTEGER DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

-- ── 7. PORTFOLIO TESTIMONIALS ─────────────────────────────────
CREATE TABLE IF NOT EXISTS portfolio_testimonials (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id     UUID REFERENCES portfolios(id) ON DELETE CASCADE NOT NULL,
  quote            TEXT NOT NULL,
  author_name      TEXT NOT NULL,
  author_role      TEXT,               -- e.g. "VP of Design, StudioX"
  author_avatar_url TEXT,
  sort_order       INTEGER DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

-- ── 8. PORTFOLIO BRANDS ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS portfolio_brands (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id     UUID REFERENCES portfolios(id) ON DELETE CASCADE NOT NULL,
  name             TEXT NOT NULL,
  logo_url         TEXT,
  website_url      TEXT,
  sort_order       INTEGER DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

-- ── 9. INQUIRIES (Unified lead capture) ──────────────────────
-- Captures leads from BOTH Creatopedia landing AND portfolio contact forms.
CREATE TABLE IF NOT EXISTS inquiries (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id       UUID REFERENCES creators(id) ON DELETE SET NULL,
  -- NULL when source is 'creatopedia_landing' (platform-level lead)
  -- Set to creator UUID when source is 'portfolio_contact'
  
  name             TEXT NOT NULL,
  email            TEXT NOT NULL,
  message          TEXT,
  phone            TEXT,
  
  source           TEXT NOT NULL DEFAULT 'portfolio_contact',
  -- 'portfolio_contact' | 'creatopedia_landing'
  
  status           TEXT DEFAULT 'new',
  -- 'new' | 'read' | 'replied' | 'archived'
  
  referrer_url     TEXT,
  ip_address       TEXT,
  user_agent       TEXT,
  
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

-- ── INDEXES ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_portfolios_creator          ON portfolios(creator_id);
CREATE INDEX IF NOT EXISTS idx_portfolios_published        ON portfolios(published);
CREATE INDEX IF NOT EXISTS idx_portfolio_hero_pid          ON portfolio_hero(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_stats_pid         ON portfolio_stats(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_journey_pid       ON portfolio_journey(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_works_pid         ON portfolio_works(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_impact_pid        ON portfolio_impact(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_testimonials_pid  ON portfolio_testimonials(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_brands_pid        ON portfolio_brands(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_creator           ON inquiries(creator_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_source            ON inquiries(source);
CREATE INDEX IF NOT EXISTS idx_inquiries_status            ON inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_email             ON inquiries(email);
CREATE INDEX IF NOT EXISTS idx_inquiries_created           ON inquiries(created_at);

-- ── AUTO updated_at TRIGGERS ──────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_portfolios_updated_at
  BEFORE UPDATE ON portfolios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_portfolio_hero_updated_at
  BEFORE UPDATE ON portfolio_hero FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_portfolio_stats_updated_at
  BEFORE UPDATE ON portfolio_stats FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_portfolio_journey_updated_at
  BEFORE UPDATE ON portfolio_journey FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_portfolio_works_updated_at
  BEFORE UPDATE ON portfolio_works FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_portfolio_impact_updated_at
  BEFORE UPDATE ON portfolio_impact FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_portfolio_testimonials_updated_at
  BEFORE UPDATE ON portfolio_testimonials FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_portfolio_brands_updated_at
  BEFORE UPDATE ON portfolio_brands FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_inquiries_updated_at
  BEFORE UPDATE ON inquiries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── ROW LEVEL SECURITY ────────────────────────────────────────
ALTER TABLE portfolios             ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_hero         ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_stats        ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_journey      ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_works        ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_impact       ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_brands       ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries              ENABLE ROW LEVEL SECURITY;

-- portfolios
CREATE POLICY "Creator manages own portfolio"
  ON portfolios FOR ALL USING (auth.uid() = creator_id);
CREATE POLICY "Public reads published portfolios"
  ON portfolios FOR SELECT USING (published = true);

-- portfolio_hero
CREATE POLICY "Creator manages own hero"
  ON portfolio_hero FOR ALL
  USING (auth.uid() = (SELECT creator_id FROM portfolios WHERE id = portfolio_id));
CREATE POLICY "Public reads hero of published portfolio"
  ON portfolio_hero FOR SELECT
  USING ((SELECT published FROM portfolios WHERE id = portfolio_id) = true);

-- portfolio_stats
CREATE POLICY "Creator manages own stats"
  ON portfolio_stats FOR ALL
  USING (auth.uid() = (SELECT creator_id FROM portfolios WHERE id = portfolio_id));
CREATE POLICY "Public reads stats of published portfolio"
  ON portfolio_stats FOR SELECT
  USING ((SELECT published FROM portfolios WHERE id = portfolio_id) = true);

-- portfolio_journey
CREATE POLICY "Creator manages own journey"
  ON portfolio_journey FOR ALL
  USING (auth.uid() = (SELECT creator_id FROM portfolios WHERE id = portfolio_id));
CREATE POLICY "Public reads journey of published portfolio"
  ON portfolio_journey FOR SELECT
  USING ((SELECT published FROM portfolios WHERE id = portfolio_id) = true);

-- portfolio_works
CREATE POLICY "Creator manages own works"
  ON portfolio_works FOR ALL
  USING (auth.uid() = (SELECT creator_id FROM portfolios WHERE id = portfolio_id));
CREATE POLICY "Public reads works of published portfolio"
  ON portfolio_works FOR SELECT
  USING ((SELECT published FROM portfolios WHERE id = portfolio_id) = true);

-- portfolio_impact
CREATE POLICY "Creator manages own impact"
  ON portfolio_impact FOR ALL
  USING (auth.uid() = (SELECT creator_id FROM portfolios WHERE id = portfolio_id));
CREATE POLICY "Public reads impact of published portfolio"
  ON portfolio_impact FOR SELECT
  USING ((SELECT published FROM portfolios WHERE id = portfolio_id) = true);

-- portfolio_testimonials
CREATE POLICY "Creator manages own testimonials"
  ON portfolio_testimonials FOR ALL
  USING (auth.uid() = (SELECT creator_id FROM portfolios WHERE id = portfolio_id));
CREATE POLICY "Public reads testimonials of published portfolio"
  ON portfolio_testimonials FOR SELECT
  USING ((SELECT published FROM portfolios WHERE id = portfolio_id) = true);

-- portfolio_brands
CREATE POLICY "Creator manages own brands"
  ON portfolio_brands FOR ALL
  USING (auth.uid() = (SELECT creator_id FROM portfolios WHERE id = portfolio_id));
CREATE POLICY "Public reads brands of published portfolio"
  ON portfolio_brands FOR SELECT
  USING ((SELECT published FROM portfolios WHERE id = portfolio_id) = true);

-- inquiries
CREATE POLICY "Public can submit inquiries"
  ON inquiries FOR INSERT WITH CHECK (true);
CREATE POLICY "Creator reads own inquiries"
  ON inquiries FOR SELECT USING (auth.uid() = creator_id);
CREATE POLICY "Creator updates own inquiry status"
  ON inquiries FOR UPDATE USING (auth.uid() = creator_id);

-- ── SEED: Create empty portfolio shells for existing creators ─
INSERT INTO portfolios (creator_id, published, theme_color)
SELECT id, false, COALESCE(brand_color, '#ff1f4b')
FROM creators
ON CONFLICT (creator_id) DO NOTHING;
```

---

## API Routes to Create

| Route | Method | Auth | Description |
|---|---|---|---|
| `/api/portfolio/[subdomain]` | GET | Public | Fetch fully hydrated portfolio for public page rendering |
| `/api/portfolio` | GET | Creator | Fetch own portfolio shell + settings |
| `/api/portfolio` | POST | Creator | Create portfolio shell |
| `/api/portfolio` | PATCH | Creator | Update settings (published, seo, theme) |
| `/api/portfolio/hero` | PUT | Creator | Upsert hero section |
| `/api/portfolio/stats` | GET/POST/PATCH/DELETE | Creator | CRUD stat items |
| `/api/portfolio/journey` | GET/POST/PATCH/DELETE | Creator | CRUD journey steps |
| `/api/portfolio/works` | GET/POST/PATCH/DELETE | Creator | CRUD work/project items |
| `/api/portfolio/impact` | GET/POST/PATCH/DELETE | Creator | CRUD value prop cards |
| `/api/portfolio/testimonials` | GET/POST/PATCH/DELETE | Creator | CRUD client testimonials |
| `/api/portfolio/brands` | GET/POST/PATCH/DELETE | Creator | CRUD brand carousel items |
| `/api/inquiries` | POST | Public | Submit inquiry (both sources) |
| `/api/inquiries` | GET | Creator | Read and manage own inquiries |

---

## TypeScript Types to Add to `types/index.ts`

```typescript
// ── Portfolio System ─────────────────────────────────────────

export interface Portfolio {
  id: string
  creator_id: string
  published: boolean
  slug: string | null
  seo_title: string | null
  seo_description: string | null
  theme_color: string
  created_at: string
  updated_at: string
}

export interface PortfolioHero {
  id: string
  portfolio_id: string
  headline: string
  subheadline: string
  tagline: string
  image_url: string | null
  cta_primary_label: string
  cta_primary_url: string
  cta_secondary_label: string
  cta_secondary_url: string
  created_at: string
  updated_at: string
}

export interface PortfolioStat {
  id: string
  portfolio_id: string
  label: string
  value: string
  sort_order: number
  created_at: string
  updated_at: string
}

export interface PortfolioJourneyStep {
  id: string
  portfolio_id: string
  chapter: string
  title: string
  description: string
  year: string | null
  align: 'left' | 'right'
  sort_order: number
  created_at: string
  updated_at: string
}

export interface PortfolioWork {
  id: string
  portfolio_id: string
  title: string
  category: string
  description: string | null
  image_url: string | null
  tags: string[]
  link_url: string | null
  featured: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface PortfolioImpact {
  id: string
  portfolio_id: string
  title: string
  description: string | null
  icon_name: string
  sort_order: number
  created_at: string
  updated_at: string
}

export interface PortfolioTestimonial {
  id: string
  portfolio_id: string
  quote: string
  author_name: string
  author_role: string | null
  author_avatar_url: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

export interface PortfolioBrand {
  id: string
  portfolio_id: string
  name: string
  logo_url: string | null
  website_url: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

// Full hydrated portfolio for public page rendering
export interface FullPortfolio {
  portfolio: Portfolio
  hero: PortfolioHero | null
  stats: PortfolioStat[]
  journey: PortfolioJourneyStep[]
  works: PortfolioWork[]
  impact: PortfolioImpact[]
  testimonials: PortfolioTestimonial[]
  brands: PortfolioBrand[]
}

// ── Inquiries ────────────────────────────────────────────────

export type InquirySource = 'portfolio_contact' | 'creatopedia_landing'
export type InquiryStatus = 'new' | 'read' | 'replied' | 'archived'

export interface Inquiry {
  id: string
  creator_id: string | null
  name: string
  email: string
  message: string | null
  phone: string | null
  source: InquirySource
  status: InquiryStatus
  referrer_url: string | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
  updated_at: string
}
```

---

## Data Flow

### Public Portfolio Page

```
GET /[subdomain]/portfolio
    │
    ▼  (server component — no client state)
    1. creators WHERE subdomain = ?
    2. portfolios WHERE creator_id = ? AND published = true
    3. Parallel fetch all sections (portfolio_id = portfolio.id):
       portfolio_hero | portfolio_stats | portfolio_journey
       portfolio_works | portfolio_impact | portfolio_testimonials | portfolio_brands
    │
    ▼
    <PortfolioPageClient data={fullPortfolio} />
```

### Contact Form (Portfolio)

```
User submits → POST /api/inquiries
  { name, email, message, creator_id: "<uuid>", source: "portfolio_contact" }
  → adminClient.from('inquiries').insert(...)
  → visible in /admin/inquiries for that creator
```

### Creatopedia Landing Inquiry

```
Reach Us / Waitlist form → POST /api/inquiries
  { name, email, message, creator_id: null, source: "creatopedia_landing" }
  → platform-level admin: WHERE source = 'creatopedia_landing'
```
