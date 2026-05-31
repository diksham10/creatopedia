# Phase 1 — Database Migrations

**Goal:** Create all missing tables and indexes. Run in Supabase SQL Editor.

## Status: ⏳ Pending

---

## Step 1.1 — Run in Supabase SQL Editor

Copy the entire block below and execute it in your Supabase project → SQL Editor.

```sql
-- === UNIFIED ANALYTICS EVENTS ===
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  creator_id UUID REFERENCES creators(id) ON DELETE CASCADE,
  prompt_id UUID REFERENCES prompts(id) ON DELETE SET NULL,
  campaign_id UUID REFERENCES ad_campaigns(id) ON DELETE SET NULL,
  placement_id UUID REFERENCES ad_placements(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  fingerprint TEXT,
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  device_type TEXT,
  os TEXT,
  browser TEXT,
  country TEXT,
  city TEXT,
  value DECIMAL(10,2),
  is_valid BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ae_creator ON analytics_events(creator_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ae_prompt ON analytics_events(prompt_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ae_campaign ON analytics_events(campaign_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ae_type ON analytics_events(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ae_session ON analytics_events(session_id);

-- === DAILY ROLLUP: PROMPTS ===
CREATE TABLE IF NOT EXISTS prompt_stats_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID REFERENCES prompts(id) ON DELETE CASCADE,
  creator_id UUID REFERENCES creators(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  views INT DEFAULT 0,
  unique_views INT DEFAULT 0,
  copies INT DEFAULT 0,
  email_captures INT DEFAULT 0,
  email_unlocks INT DEFAULT 0,
  payment_unlocks INT DEFAULT 0,
  pdf_views INT DEFAULT 0,
  pdf_downloads INT DEFAULT 0,
  revenue DECIMAL(10,2) DEFAULT 0,
  conversion_rate DECIMAL(5,2) DEFAULT 0,
  UNIQUE(prompt_id, date)
);

-- === DAILY ROLLUP: CAMPAIGNS ===
CREATE TABLE IF NOT EXISTS campaign_stats_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES ad_campaigns(id) ON DELETE CASCADE,
  creator_id UUID REFERENCES creators(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  impressions INT DEFAULT 0,
  unique_impressions INT DEFAULT 0,
  clicks INT DEFAULT 0,
  unique_clicks INT DEFAULT 0,
  ctr DECIMAL(5,2) DEFAULT 0,
  frequency DECIMAL(5,2) DEFAULT 0,
  UNIQUE(campaign_id, date)
);

-- === DAILY ROLLUP: CAMPAIGN × PROMPT ===
CREATE TABLE IF NOT EXISTS campaign_prompt_stats_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES ad_campaigns(id) ON DELETE CASCADE,
  creator_id UUID REFERENCES creators(id) ON DELETE CASCADE,
  prompt_id UUID REFERENCES prompts(id) ON DELETE CASCADE,
  placement_id UUID REFERENCES ad_placements(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  impressions INT DEFAULT 0,
  clicks INT DEFAULT 0,
  ctr DECIMAL(5,2) DEFAULT 0,
  UNIQUE(campaign_id, prompt_id, date)
);

-- === DAILY ROLLUP: CREATOR ===
CREATE TABLE IF NOT EXISTS creator_stats_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES creators(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_views INT DEFAULT 0,
  unique_visitors INT DEFAULT 0,
  total_copies INT DEFAULT 0,
  email_captures INT DEFAULT 0,
  total_unlocks INT DEFAULT 0,
  revenue DECIMAL(10,2) DEFAULT 0,
  ad_impressions INT DEFAULT 0,
  ad_clicks INT DEFAULT 0,
  UNIQUE(creator_id, date)
);

-- === RLS ===
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_stats_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_stats_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_prompt_stats_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_stats_daily ENABLE ROW LEVEL SECURITY;

-- Drop policies first in case they already exist
DROP POLICY IF EXISTS "Public inserts events" ON analytics_events;
DROP POLICY IF EXISTS "Creators read own events" ON analytics_events;
DROP POLICY IF EXISTS "Creators read own prompt stats" ON prompt_stats_daily;
DROP POLICY IF EXISTS "Creators read own campaign stats" ON campaign_stats_daily;
DROP POLICY IF EXISTS "Creators read own campaign prompt stats" ON campaign_prompt_stats_daily;
DROP POLICY IF EXISTS "Creators read own creator stats" ON creator_stats_daily;

CREATE POLICY "Public inserts events" ON analytics_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Creators read own events" ON analytics_events FOR SELECT USING (auth.uid() = creator_id);
CREATE POLICY "Creators read own prompt stats" ON prompt_stats_daily FOR SELECT USING (auth.uid() = creator_id);
CREATE POLICY "Creators read own campaign stats" ON campaign_stats_daily FOR SELECT USING (auth.uid() = creator_id);
CREATE POLICY "Creators read own campaign prompt stats" ON campaign_prompt_stats_daily FOR SELECT USING (auth.uid() = creator_id);
CREATE POLICY "Creators read own creator stats" ON creator_stats_daily FOR SELECT USING (auth.uid() = creator_id);

-- === AGGREGATE FUNCTION ===
CREATE OR REPLACE FUNCTION aggregate_daily_stats(target_date DATE DEFAULT CURRENT_DATE)
RETURNS void AS $$
BEGIN
  -- Prompt rollup from analytics_events
  INSERT INTO prompt_stats_daily (
    prompt_id, creator_id, date,
    views, unique_views, copies, email_captures, email_unlocks,
    payment_unlocks, pdf_views, pdf_downloads, revenue, conversion_rate
  )
  SELECT
    prompt_id, creator_id, target_date,
    COUNT(*) FILTER (WHERE event_type = 'prompt_view'),
    COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'prompt_view'),
    COUNT(*) FILTER (WHERE event_type = 'prompt_copy'),
    COUNT(*) FILTER (WHERE event_type = 'email_capture'),
    COUNT(*) FILTER (WHERE event_type = 'email_unlock'),
    COUNT(*) FILTER (WHERE event_type = 'payment_unlock'),
    COUNT(*) FILTER (WHERE event_type = 'pdf_view'),
    COUNT(*) FILTER (WHERE event_type = 'pdf_download'),
    COALESCE(SUM(value) FILTER (WHERE event_type = 'payment_unlock'), 0),
    CASE WHEN COUNT(*) FILTER (WHERE event_type = 'prompt_view') = 0 THEN 0
    ELSE ROUND(
      COUNT(*) FILTER (WHERE event_type IN ('prompt_copy','email_unlock','payment_unlock'))::decimal /
      COUNT(*) FILTER (WHERE event_type = 'prompt_view') * 100, 2
    ) END
  FROM analytics_events
  WHERE DATE(created_at) = target_date AND prompt_id IS NOT NULL AND is_valid = true
  GROUP BY prompt_id, creator_id
  ON CONFLICT (prompt_id, date) DO UPDATE SET
    views = EXCLUDED.views, unique_views = EXCLUDED.unique_views,
    copies = EXCLUDED.copies, email_captures = EXCLUDED.email_captures,
    email_unlocks = EXCLUDED.email_unlocks, payment_unlocks = EXCLUDED.payment_unlocks,
    pdf_views = EXCLUDED.pdf_views, pdf_downloads = EXCLUDED.pdf_downloads,
    revenue = EXCLUDED.revenue, conversion_rate = EXCLUDED.conversion_rate;

  -- Campaign rollup from analytics_events
  INSERT INTO campaign_stats_daily (
    campaign_id, creator_id, date,
    impressions, unique_impressions, clicks, unique_clicks, ctr, frequency
  )
  SELECT
    campaign_id, creator_id, target_date,
    COUNT(*) FILTER (WHERE event_type = 'ad_impression'),
    COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'ad_impression'),
    COUNT(*) FILTER (WHERE event_type = 'ad_click'),
    COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'ad_click'),
    CASE WHEN COUNT(*) FILTER (WHERE event_type = 'ad_impression') = 0 THEN 0
    ELSE ROUND(
      COUNT(*) FILTER (WHERE event_type = 'ad_click')::decimal /
      COUNT(*) FILTER (WHERE event_type = 'ad_impression') * 100, 2
    ) END,
    CASE WHEN COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'ad_impression') = 0 THEN 0
    ELSE ROUND(
      COUNT(*) FILTER (WHERE event_type = 'ad_impression')::decimal /
      COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'ad_impression'), 2
    ) END
  FROM analytics_events
  WHERE DATE(created_at) = target_date AND campaign_id IS NOT NULL AND is_valid = true
  GROUP BY campaign_id, creator_id
  ON CONFLICT (campaign_id, date) DO UPDATE SET
    impressions = EXCLUDED.impressions, unique_impressions = EXCLUDED.unique_impressions,
    clicks = EXCLUDED.clicks, unique_clicks = EXCLUDED.unique_clicks,
    ctr = EXCLUDED.ctr, frequency = EXCLUDED.frequency;

  -- Campaign × Prompt rollup from analytics_events
  INSERT INTO campaign_prompt_stats_daily (
    campaign_id, prompt_id, creator_id, placement_id, date,
    impressions, clicks, ctr
  )
  SELECT
    campaign_id, prompt_id, creator_id, MAX(placement_id) as placement_id, target_date,
    COUNT(*) FILTER (WHERE event_type = 'ad_impression'),
    COUNT(*) FILTER (WHERE event_type = 'ad_click'),
    CASE WHEN COUNT(*) FILTER (WHERE event_type = 'ad_impression') = 0 THEN 0
    ELSE ROUND(
      COUNT(*) FILTER (WHERE event_type = 'ad_click')::decimal /
      COUNT(*) FILTER (WHERE event_type = 'ad_impression') * 100, 2
    ) END
  FROM analytics_events
  WHERE DATE(created_at) = target_date AND campaign_id IS NOT NULL AND prompt_id IS NOT NULL AND is_valid = true
  GROUP BY campaign_id, prompt_id, creator_id
  ON CONFLICT (campaign_id, prompt_id, date) DO UPDATE SET
    impressions = EXCLUDED.impressions, clicks = EXCLUDED.clicks, ctr = EXCLUDED.ctr;

  -- Creator rollup from analytics_events
  INSERT INTO creator_stats_daily (
    creator_id, date,
    total_views, unique_visitors, total_copies, email_captures,
    total_unlocks, revenue, ad_impressions, ad_clicks
  )
  SELECT
    creator_id, target_date,
    COUNT(*) FILTER (WHERE event_type = 'prompt_view'),
    COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'prompt_view'),
    COUNT(*) FILTER (WHERE event_type = 'prompt_copy'),
    COUNT(*) FILTER (WHERE event_type = 'email_capture'),
    COUNT(*) FILTER (WHERE event_type IN ('email_unlock','payment_unlock')),
    COALESCE(SUM(value) FILTER (WHERE event_type = 'payment_unlock'), 0),
    COUNT(*) FILTER (WHERE event_type = 'ad_impression'),
    COUNT(*) FILTER (WHERE event_type = 'ad_click')
  FROM analytics_events
  WHERE DATE(created_at) = target_date AND is_valid = true
  GROUP BY creator_id
  ON CONFLICT (creator_id, date) DO UPDATE SET
    total_views = EXCLUDED.total_views, unique_visitors = EXCLUDED.unique_visitors,
    total_copies = EXCLUDED.total_copies, email_captures = EXCLUDED.email_captures,
    total_unlocks = EXCLUDED.total_unlocks, revenue = EXCLUDED.revenue,
    ad_impressions = EXCLUDED.ad_impressions, ad_clicks = EXCLUDED.ad_clicks;
END;
$$ LANGUAGE plpgsql;
```

## Step 1.2 — Verify

After running, execute this in Supabase SQL Editor to verify:
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'analytics_events', 'prompt_stats_daily', 'campaign_stats_daily',
    'campaign_prompt_stats_daily', 'creator_stats_daily'
  );
```

Should return 5 rows. ✅

## Step 1.3 — Add CRON_SECRET to .env.local

```bash
echo "CRON_SECRET=$(openssl rand -hex 32)" >> .env.local
```
