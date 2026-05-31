# Phase 5 — Analytics Dashboard

> **Run after Phase 4 is complete.**

---

## Objective

Build the analytics page at `/admin/analytics` with:
- Line chart: daily views (last 30 days) — Recharts
- Bar chart: copies vs email captures per prompt
- Top 5 prompts by views table
- Top 5 prompts by conversion rate table
- Recent email captures list
- Wire up real view/event tracking on the public page

---

## Install Recharts

```bash
npm install recharts
```

---

## File Structure

```
app/
  (admin)/
    admin/
      analytics/
        page.tsx
components/
  admin/
    AnalyticsChart.tsx    ← Line + Bar charts (client component)
app/
  api/
    analytics/
      stats/
        route.ts          ← GET aggregated stats for dashboard
```

---

## Database Queries Needed

### Daily Views (last 30 days)
```sql
SELECT 
  DATE(created_at) as date,
  COUNT(*) as views
FROM views
WHERE page_id IN (
  SELECT id FROM pages WHERE prompt_id IN (
    SELECT id FROM prompts WHERE creator_id = $1
  )
)
AND created_at >= now() - interval '30 days'
GROUP BY DATE(created_at)
ORDER BY date ASC
```

### Copies vs Email Captures per Prompt
```sql
SELECT 
  p.title,
  COUNT(CASE WHEN e.type = 'copy' THEN 1 END) as copies,
  COUNT(ec.id) as email_captures
FROM prompts p
LEFT JOIN pages pg ON pg.prompt_id = p.id
LEFT JOIN events e ON e.page_id = pg.id
LEFT JOIN email_captures ec ON ec.prompt_id = p.id
WHERE p.creator_id = $1
GROUP BY p.id, p.title
```

### Top Prompts by Views
```sql
SELECT p.id, p.title, p.slug, COUNT(v.id) as view_count
FROM prompts p
LEFT JOIN pages pg ON pg.prompt_id = p.id
LEFT JOIN views v ON v.page_id = pg.id
WHERE p.creator_id = $1
GROUP BY p.id, p.title, p.slug
ORDER BY view_count DESC
LIMIT 5
```

---

## `app/api/analytics/stats/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Use Supabase RPC or raw SQL via supabase.rpc() for the complex queries above
  // Return: { dailyViews, promptStats, topByViews, topByConversion, recentCaptures }
  
  const { data: recentCaptures } = await supabase
    .from('email_captures')
    .select('email, captured_at, prompts(title, slug)')
    .order('captured_at', { ascending: false })
    .limit(10)

  return NextResponse.json({ recentCaptures })
}
```

> **Note:** For complex aggregation queries, create Supabase RPC functions (SQL functions) and call them via `supabase.rpc('function_name', { creator_id: user.id })`.

---

## `app/(admin)/admin/analytics/page.tsx`

Server component — fetch data, pass to client charts:

```tsx
import AnalyticsChart from '@/components/admin/AnalyticsChart'

export default async function AnalyticsPage() {
  // Fetch stats from API or directly from Supabase
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-white">Analytics</h1>
      
      {/* Line chart: daily views */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Daily Views — Last 30 Days</h2>
        <AnalyticsChart type="line" data={dailyViews} />
      </section>

      {/* Bar chart: copies vs email captures */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Engagement per Prompt</h2>
        <AnalyticsChart type="bar" data={promptStats} />
      </section>

      {/* Top prompts tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopPromptsTable title="Top by Views" data={topByViews} metric="view_count" />
        <TopPromptsTable title="Top by Conversion" data={topByConversion} metric="conversion_rate" />
      </div>

      {/* Recent email captures */}
      <RecentCaptures captures={recentCaptures} />
    </div>
  )
}
```

---

## `components/admin/AnalyticsChart.tsx`

```tsx
'use client'
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

interface Props {
  type: 'line' | 'bar'
  data: Record<string, unknown>[]
}

export default function AnalyticsChart({ type, data }: Props) {
  if (type === 'line') {
    return (
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
          <XAxis dataKey="date" stroke="#71717a" tick={{ fontSize: 12 }} />
          <YAxis stroke="#71717a" tick={{ fontSize: 12 }} />
          <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46' }} />
          <Line type="monotone" dataKey="views" stroke="#6366f1" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    )
  }
  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
        <XAxis dataKey="title" stroke="#71717a" tick={{ fontSize: 11 }} />
        <YAxis stroke="#71717a" tick={{ fontSize: 12 }} />
        <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46' }} />
        <Legend />
        <Bar dataKey="copies" fill="#6366f1" radius={[4,4,0,0]} />
        <Bar dataKey="email_captures" fill="#10b981" radius={[4,4,0,0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
```

---

## Wire Up View Tracking on Public Page

In `app/(public)/[subdomain]/[slug]/page.tsx`, after rendering, fire a view event client-side:

```tsx
// Add ViewTracker client component
'use client'
import { useEffect } from 'react'

export function ViewTracker({ pageId }: { pageId: string }) {
  useEffect(() => {
    const sessionId = sessionStorage.getItem('sid') ?? crypto.randomUUID()
    sessionStorage.setItem('sid', sessionId)
    fetch('/api/analytics/view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ page_id: pageId, session_id: sessionId, referrer: document.referrer }),
    })
  }, [pageId])
  return null
}
```

---

## Supabase RPC Functions to Create

Add to the migration file or run in Supabase SQL editor:

```sql
CREATE OR REPLACE FUNCTION get_daily_views(p_creator_id UUID)
RETURNS TABLE (date DATE, views BIGINT) AS $$
  SELECT DATE(v.created_at), COUNT(v.id)
  FROM views v
  JOIN pages pg ON pg.id = v.page_id
  JOIN prompts p ON p.id = pg.prompt_id
  WHERE p.creator_id = p_creator_id
  AND v.created_at >= now() - interval '30 days'
  GROUP BY DATE(v.created_at)
  ORDER BY 1 ASC
$$ LANGUAGE sql STABLE;
```

---

## Validation Checklist

- [ ] `/admin/analytics` loads without errors
- [ ] Line chart renders daily views (may be empty if no data yet)
- [ ] Bar chart renders per-prompt engagement
- [ ] Top prompts tables show correct rankings
- [ ] Recent email captures list shows latest submissions
- [ ] Viewing a public prompt page fires a view event (check Supabase `views` table)
- [ ] `npm run build` passes without errors
