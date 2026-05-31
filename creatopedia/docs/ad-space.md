You are an expert Next.js 14 full-stack developer working on an EXISTING production 
codebase called PromptHub. 

Your job is NOT to build from scratch. Your job is to:
1. ANALYZE the existing codebase first
2. UNDERSTAND what's already built
3. EXTEND it with new features — without breaking anything existing

---

## STEP 1: CODEBASE ANALYSIS (DO THIS BEFORE WRITING ANY CODE)

Before touching anything, run these commands and read the output carefully:

```bash
# Understand project structure
find . -type f -name "*.ts" -o -name "*.tsx" | grep -v node_modules | grep -v .next | sort

# Read package.json to understand installed dependencies
cat package.json

# Check existing DB schema / migrations
ls -la supabase/migrations/ 2>/dev/null || echo "No migrations folder"
cat supabase/migrations/*.sql 2>/dev/null || echo "No migration files found"

# Check existing API routes
find ./app/api -type f | sort

# Check existing components
find ./components -type f | sort

# Check existing types
cat types/index.ts 2>/dev/null || cat src/types/index.ts 2>/dev/null

# Check environment variables in use
cat .env.local 2>/dev/null || cat .env.example 2>/dev/null

# Check Supabase client setup
find . -name "*.ts" | xargs grep -l "createClient\|supabase" | grep -v node_modules
```

After running these, answer these questions before proceeding:
- What tables already exist in the database?
- What API routes already exist?
- What components already exist?
- What auth pattern is being used?
- What UI conventions are already established (component structure, naming, styling)?
- Are there any existing ad-related tables or components?
- Are there any existing PDF-related features?

State your findings explicitly before writing any code. If you are unsure about 
anything, read the relevant file first.

---

## STEP 2: UNDERSTAND THE GOAL

PromptHub is a branded prompt-delivery platform for AI content creators. Creators 
post AI content on Instagram/TikTok, viewers comment a keyword, get a DM with a 
branded link, and land on a beautiful mobile-first page showing the prompt (or PDF).

The platform currently handles:
- Creator dashboard + branding
- Prompt CRUD (text prompts with open/email/payment gates)
- Public SSR prompt pages on creator subdomains
- Email capture + analytics (views, copies, events)
- Admin panel

We are now adding THREE new feature areas. Integrate them cleanly into whatever 
patterns already exist in the codebase.

---

## STEP 3: FEATURE AREA 1 — PDF SUPPORT

### What to check first:
- Does the prompts table have a content_type column?
- Does the prompts table have a pdf_url column?
- Is there already a file upload flow in the codebase? If yes, reuse it.
- Is there a media/ storage bucket already configured in Supabase?

### Database changes (only if not already present):
```sql
-- Only run if content_type column doesn't exist
ALTER TABLE prompts ADD COLUMN IF NOT EXISTS content_type TEXT DEFAULT 'prompt';
-- values: 'prompt' | 'pdf'

ALTER TABLE prompts ADD COLUMN IF NOT EXISTS pdf_url TEXT;
```

### What to build:

ADMIN — Extend existing prompt create/edit form:
  - Add content type toggle at top of form: [📝 Text Prompt] [📄 PDF Document]
  - When 'prompt' selected: show existing textarea (no change)
  - When 'pdf' selected:
    - Hide prompt content textarea
    - Show PDF upload dropzone (same upload pattern as thumbnail if it exists)
    - Accept: application/pdf only
    - Max size: 20MB
    - Show file name + size after upload
    - Store in Supabase Storage media/ bucket at path: pdfs/{creator_id}/{uuid}.pdf
  - Gate logic (open/email/payment) stays IDENTICAL — do not change it
  - All other form fields stay identical

PUBLIC PAGE — Extend existing PromptGate component (or equivalent):
  - Detect content_type from prompt data
  - If content_type === 'pdf':
    - Replace prompt text area with PDF viewer
    - Use react-pdf (install if not present: npm install react-pdf)
    - Show first page as preview (always visible)
    - If gate_type === 'open': show all pages + download button immediately
    - If gate_type === 'email': show page 1 only + blur overlay on rest
      After email submit: unlock all pages + show download button
    - If gate_type === 'payment': show page 1 only, payment gate same as text prompt
    - Download button: direct link to Supabase Storage URL
    - PDF viewer must be lazy loaded (dynamic import, no SSR)
  - If content_type === 'prompt': existing behavior unchanged

API — Extend existing upload route (or create /api/upload/pdf if needed):
  - Validate file is PDF
  - Validate size < 20MB
  - Upload to Supabase Storage
  - Return { url: string }

---

## STEP 4: FEATURE AREA 2 — AD SYSTEM

### What to check first:
- Do any ad-related tables exist? (ad_campaigns, ad_placements, ad_clicks, etc.)
- Is there an /admin/ads route already?
- Are there any advertiser/client tables?
- Is there an existing analytics pattern I should follow?

### Database changes (only run what doesn't exist):

```sql
-- Ad Clients (the companies/people buying ad placements)
CREATE TABLE IF NOT EXISTS ad_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES creators(id) ON DELETE CASCADE,
  name TEXT NOT NULL,                    -- "Nike Nepal"
  email TEXT,
  phone TEXT,
  company TEXT,
  website TEXT,
  notes TEXT,                            -- internal notes for creator
  status TEXT DEFAULT 'active',          -- active | inactive
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ad Campaigns (one client can have many campaigns)
CREATE TABLE IF NOT EXISTS ad_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES creators(id) ON DELETE CASCADE,
  client_id UUID REFERENCES ad_clients(id) ON DELETE SET NULL,
  name TEXT NOT NULL,                    -- "Nike Jan 2025 Campaign"
  banner_url TEXT NOT NULL,              -- image in Supabase Storage
  banner_alt TEXT,                       -- accessibility text
  target_url TEXT NOT NULL,              -- destination URL
  utm_source TEXT DEFAULT 'prompthub',
  utm_medium TEXT DEFAULT 'banner',
  utm_campaign TEXT,
  client_webhook_url TEXT,              -- optional: push events to client
  report_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  status TEXT DEFAULT 'active',          -- active | paused | ended | scheduled
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ad Placements (which campaign shows on which pages + position)
CREATE TABLE IF NOT EXISTS ad_placements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES ad_campaigns(id) ON DELETE CASCADE,
  prompt_id UUID REFERENCES prompts(id) ON DELETE CASCADE,
  -- NULL prompt_id means "show on ALL creator's pages"
  position TEXT DEFAULT 'below_video',
  -- below_video | above_gate | below_gate
  is_global BOOLEAN DEFAULT false,       -- true = show on all pages
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Ad Impressions (ad rendered + visible in viewport)
CREATE TABLE IF NOT EXISTS ad_impressions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES ad_campaigns(id) ON DELETE CASCADE,
  placement_id UUID REFERENCES ad_placements(id) ON DELETE CASCADE,
  prompt_id UUID REFERENCES prompts(id) ON DELETE SET NULL,
  session_id TEXT,
  device TEXT,
  country TEXT,
  referrer TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Ad Clicks (user clicked the ad)
CREATE TABLE IF NOT EXISTS ad_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES ad_campaigns(id) ON DELETE CASCADE,
  placement_id UUID REFERENCES ad_placements(id) ON DELETE CASCADE,
  prompt_id UUID REFERENCES prompts(id) ON DELETE SET NULL,
  session_id TEXT,
  device TEXT,
  country TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_impressions_campaign ON ad_impressions(campaign_id);
CREATE INDEX IF NOT EXISTS idx_impressions_prompt ON ad_impressions(prompt_id);
CREATE INDEX IF NOT EXISTS idx_impressions_created ON ad_impressions(created_at);
CREATE INDEX IF NOT EXISTS idx_clicks_campaign ON ad_clicks(campaign_id);
CREATE INDEX IF NOT EXISTS idx_clicks_prompt ON ad_clicks(prompt_id);
CREATE INDEX IF NOT EXISTS idx_clicks_created ON ad_clicks(created_at);
CREATE INDEX IF NOT EXISTS idx_placements_campaign ON ad_placements(campaign_id);
CREATE INDEX IF NOT EXISTS idx_clients_creator ON ad_clients(creator_id);

-- RLS
ALTER TABLE ad_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_impressions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators manage own clients"
  ON ad_clients FOR ALL USING (auth.uid() = creator_id);

CREATE POLICY "Creators manage own campaigns"
  ON ad_campaigns FOR ALL USING (auth.uid() = creator_id);

CREATE POLICY "Public can insert impressions"
  ON ad_impressions FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can insert clicks"
  ON ad_clicks FOR INSERT WITH CHECK (true);

CREATE POLICY "Public reads placements for display"
  ON ad_placements FOR SELECT USING (true);

CREATE POLICY "Public reads active campaigns"
  ON ad_campaigns FOR SELECT USING (status = 'active');
```

---

### ADMIN — AD CLIENTS CRUD

Add to sidebar navigation (match existing nav pattern exactly):
  "Ads" section with sub-items: Clients · Campaigns

Route: /admin/ads/clients

LIST PAGE (/admin/ads/clients):
  Match the exact same table/list pattern used in /admin/prompts or equivalent.
  
  Table columns:
    Client Name | Company | Email | Active Campaigns | Status | Actions
  
  Actions per row (match existing action pattern):
    Edit | View Campaigns | Deactivate | Delete
  
  Top bar:
    - "Ad Clients" H1
    - [+ New Client] button (match existing button style)
  
  Empty state:
    - "No ad clients yet. Add your first advertiser."
    - [+ Add Client] button

CREATE/EDIT PAGE (/admin/ads/clients/new and /admin/ads/clients/[id]):
  Form fields:
    - Client Name (required)
    - Company name
    - Contact Email
    - Phone number
    - Website URL
    - Internal Notes (textarea — only creator sees this)
    - Status toggle: Active / Inactive
  
  Below form on edit page:
    - "Campaigns" section: list of this client's campaigns with quick stats
    - [+ New Campaign for this Client] button

---

### ADMIN — AD CAMPAIGNS CRUD

Route: /admin/ads/campaigns

LIST PAGE (/admin/ads/campaigns):
  Table columns:
    Campaign Name | Client | Status | Impressions | Clicks | CTR | Dates | Actions
  
  CTR = (clicks / impressions * 100).toFixed(2) + '%'
  Color code CTR: green >5% | amber 2-5% | red <2%
  
  Status badge colors (match existing badge pattern):
    active = green | paused = amber | ended = muted | scheduled = blue
  
  Actions: Edit | View Report | Copy Report Link | Pause/Resume | Delete
  
  Filters:
    [All] [Active] [Paused] [Ended] — tab pills
    Client filter dropdown

CREATE/EDIT PAGE (/admin/ads/campaigns/new and /admin/ads/campaigns/[id]):
  
  Section: "Campaign Details"
    - Campaign name (required)
    - Client (select from ad_clients, or [+ Add New Client] inline)
    - Status (select: active | paused | scheduled | ended)
    - Start date + End date (date pickers)
  
  Section: "Ad Creative"
    - Banner image upload
      Recommended size hint: "1200 × 300px (4:1 ratio)"
      Show live preview of banner at actual display size after upload
      Store at: ads/{creator_id}/{campaign_id}/banner.{ext}
    - Alt text input (for accessibility)
    - Destination URL (required)
      Show preview: the final URL with UTM params appended
      Auto-preview updates as UTM fields change
  
  Section: "UTM Tracking"
    - utm_source (prefilled: 'prompthub', editable)
    - utm_medium (prefilled: 'banner', editable)
    - utm_campaign (auto-suggested from campaign name, editable)
    - Live preview of final URL:
      "https://example.com?utm_source=prompthub&utm_medium=banner&utm_campaign=..."
      Copy button next to preview
  
  Section: "Placement Rules"
    - Radio: 
        ○ Show on ALL my prompt pages (global)
        ○ Show on specific pages only
    - If specific pages: multi-select checklist of creator's published prompts
    - Position select per placement:
        Below video | Above gate | Below gate
  
  Section: "Client Reporting"
    - Report link (auto-generated, read-only):
      "https://prompthub.app/ads/report/{report_token}"
      [Copy Link] button
      [Open Report] button (opens in new tab)
    - Client webhook URL (optional):
      Placeholder: "https://client-system.com/webhook"
      Helper: "We'll POST click events here in real-time"
  
  On save: validate all required fields with Zod before submitting

---

### API ROUTES FOR ADS

Check if these routes exist. If not, create them following existing API route patterns.

GET /api/ads/placements?prompt_id={id}
  - Returns active ad placements for a given prompt page
  - Joins campaigns to get banner_url, target_url, etc.
  - Used by the public page to render the correct ad
  - Checks campaign date range (starts_at / ends_at)
  - Returns empty array if no active placements

POST /api/ads/impression
  - Body: { campaign_id, placement_id, prompt_id, session_id }
  - Insert into ad_impressions (fire and forget, no await on client)
  - Returns 200 immediately
  - Do NOT block page rendering for this

GET /api/ads/click (redirect endpoint)
  - Query: ?placement_id=&campaign_id=&prompt_id=
  - 1. Log to ad_clicks table (async, no await)
  - 2. Fire client webhook if configured (async, no await)
  - 3. Fetch target_url + UTM params from campaign
  - 4. Build final URL with UTM params + utm_content={prompt_id}
  - 5. Return 302 redirect to final URL
  - IMPORTANT: ALL ad banner hrefs point to this endpoint, never directly to target_url

GET /api/ads/report/[token]
  - Public endpoint (no auth)
  - Look up campaign by report_token
  - Return aggregated stats:
    total_impressions, total_clicks, ctr,
    daily_breakdown (last 30 days),
    per_prompt_breakdown,
    device_breakdown,
    country_breakdown

---

### PUBLIC PAGE — AD BANNER COMPONENT

Create AdBanner component. Insert into existing public page layout at configured 
position (below_video | above_gate | below_gate).

On page load:
  1. Fetch /api/ads/placements?prompt_id={id} (server-side in SSR, or client-side)
  2. If placements returned: render AdBanner
  3. If no placements: render nothing (no empty space)

AdBanner component behavior:
  - Renders banner image in a clean container
  - Image click: navigates to /api/ads/click?... (the tracking redirect)
  - Uses IntersectionObserver to detect when 50%+ of ad enters viewport
  - On entering viewport: POST /api/ads/impression (once per session via sessionStorage)
  - sessionStorage key: imp_{placement_id} — prevents duplicate impressions
  - Subtle label: "Sponsored" — 10px, --text-muted, top-right corner
  - No autoplay, no animation on the ad itself

---

### CLIENT REPORT PAGE (PUBLIC, NO AUTH)

Route: /ads/report/[token] (on main domain, not subdomain)

Fetch campaign data via /api/ads/report/[token]

Layout — clean, minimal, branded:

  Header:
    PromptHub logo (small) + "Campaign Report" label
    Campaign name (Syne 700, large)
    Client name | Date range | Generated: [today's date]
    Status badge

  Summary cards (4):
    Total Impressions | Total Clicks | CTR | Active Since

  Chart 1: Daily clicks + impressions (last 30 days)
    Dual line chart — one line each, Recharts
    Match admin analytics chart style

  Chart 2: Per-prompt-page breakdown
    Table format:
    Prompt Page | Impressions | Clicks | CTR
    Sorted by clicks descending
    Each row links to the actual prompt page

  Chart 3: Device breakdown
    Simple: Mobile X% · Desktop Y% (progress bar style)

  Chart 4: Top countries
    Simple ranked list with percentages

  Footer:
    "Powered by PromptHub · Data updates every hour"
    "Questions? Contact {creator email or handle}"

  Important:
    - This page must work without any login
    - No sensitive data exposed (no emails, no revenue data)
    - If token not found: show "Report not found or expired"
    - Add noindex meta tag (don't want this in Google)

---

## STEP 5: FEATURE AREA 3 — ENHANCED ANALYTICS

### What to check first:
- What analytics are already tracked? Check existing events table and PostHog setup.
- Is there an existing /admin/analytics page? What does it show?
- Extend it — do not replace it.

### Add to existing analytics page:

New tab or section: "Ads Performance"
  - Overall: total impressions, total clicks, overall CTR across all campaigns
  - Campaign comparison table:
    Campaign | Client | Impressions | Clicks | CTR | Revenue potential
  - Best performing prompt pages for ads (by CTR)
  - Click volume chart over time

Per-prompt analytics (extend existing per-prompt view if it exists):
  - Add "Ad Performance" section to individual prompt analytics
  - Shows: which campaigns ran on this page, impressions, clicks, CTR
  - Timeline of ad activity on this specific page

---

## STEP 6: TYPESCRIPT TYPES

After analyzing existing types/index.ts, ADD these types (do not overwrite existing):

```typescript
// Ad System Types
export type AdClient = {
  id: string
  creator_id: string
  name: string
  email: string | null
  phone: string | null
  company: string | null
  website: string | null
  notes: string | null
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
}

export type AdCampaign = {
  id: string
  creator_id: string
  client_id: string | null
  name: string
  banner_url: string
  banner_alt: string | null
  target_url: string
  utm_source: string
  utm_medium: string
  utm_campaign: string | null
  client_webhook_url: string | null
  report_token: string
  status: 'active' | 'paused' | 'ended' | 'scheduled'
  starts_at: string | null
  ends_at: string | null
  created_at: string
  updated_at: string
  // Joined fields
  client?: AdClient
  impressions_count?: number
  clicks_count?: number
}

export type AdPlacement = {
  id: string
  campaign_id: string
  prompt_id: string | null
  position: 'below_video' | 'above_gate' | 'below_gate'
  is_global: boolean
  created_at: string
  campaign?: AdCampaign
}

export type AdStats = {
  total_impressions: number
  total_clicks: number
  ctr: number
  daily_breakdown: { date: string; impressions: number; clicks: number }[]
  per_prompt_breakdown: { prompt_id: string; title: string; impressions: number; clicks: number; ctr: number }[]
  device_breakdown: { device: string; count: number; percentage: number }[]
  country_breakdown: { country: string; count: number; percentage: number }[]
}

// PDF Support Types (extend existing Prompt type)
// Add these fields to your existing Prompt type:
// content_type: 'prompt' | 'pdf'
// pdf_url: string | null
```

---

## STEP 7: NAVIGATION UPDATES

Check existing sidebar/nav component. Add these items following the EXACT same 
pattern and styling already used: