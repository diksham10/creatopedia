# Phase 6 — Public Ad Report Page Upgrade

**Goal:** Enhance the existing `/ads/report/[token]` page with missing sections from the spec.

## Status: ⏳ Pending

---

## Current State

The `/ads/report/[token]` page **already exists** with:
- ✅ Header with campaign name, client name, status
- ✅ Headline numbers (Impressions, Clicks, CTR)
- ✅ Daily breakdown chart
- ✅ Per-prompt breakdown table
- ✅ Device breakdown bars
- ✅ Top regions list
- ✅ Footer

## Missing vs. Spec

| Feature | Status |
|---------|--------|
| `noindex` meta tag | ❌ Missing |
| Benchmark callout box | ❌ Missing |
| Unique counts + Frequency below headline | ❌ Missing |
| Click verification section | ❌ Missing |
| Last 20 clicks table (no PII) | ❌ Missing |
| UTM note section | ❌ Missing |
| "Data updated hourly" in header | ⚠️ Footer only, not header |

---

## API Changes — `GET /api/ads/report/[token]`

Add to response:
```typescript
{
  // existing fields...
  unique_impressions: number,
  unique_clicks: number,
  frequency: number,
  last_clicks: { timestamp: string, device: string, country: string }[],  // last 20, no PII
}
```

Calculation:
```sql
unique_impressions = COUNT(DISTINCT session_id) WHERE event_type = 'ad_impression'
unique_clicks = COUNT(DISTINCT session_id) WHERE event_type = 'ad_click'
frequency = total_impressions / unique_impressions (or 1 if 0)
last_clicks = last 20 rows from ad_clicks ORDER BY created_at DESC
```

---

## Page Changes — `/ads/report/[token]/page.tsx`

### Add to JSX:

1. **`<head>` meta noindex** — use Next.js `generateMetadata` to return `robots: 'noindex'`

2. **"Data updated hourly"** badge in header alongside campaign name

3. **Unique counts row** below headline numbers:
```tsx
<div className="text-sm text-zinc-400 mt-2">
  {stats.unique_impressions.toLocaleString()} unique • 
  {stats.unique_clicks.toLocaleString()} unique clicks • 
  {stats.frequency.toFixed(1)}x avg frequency
</div>
```

4. **Benchmark callout box** after headline numbers:
```tsx
<div className="bg-indigo-950 border border-indigo-800 rounded-2xl p-6 text-sm">
  <span className="font-bold text-indigo-300">Industry benchmark:</span> 
  Social display avg CTR is 0.5–2%. 
  Your campaign at {ctr}% is {(ctr / 1.25).toFixed(1)}x {ctr > 1.25 ? 'above' : 'below'} average.
</div>
```

5. **Click verification section**:
```tsx
<section>
  <h2>Click Verification</h2>
  <p>All clicks tracked through prompthub.app/api/ads/click. 
     Bot traffic filtered by user-agent validation. 
     Each click is logged with timestamp, device type, and geo-location.</p>
</section>
```

6. **Last 20 clicks table** (Timestamp | Device | Country — no email/IP):
```tsx
<table>
  <thead>
    <tr>
      <th>Timestamp (UTC)</th>
      <th>Device</th>
      <th>Country</th>
    </tr>
  </thead>
  <tbody>
    {stats.last_clicks.map((c, i) => (
      <tr key={i}>
        <td>{new Date(c.timestamp).toUTCString()}</td>
        <td className="capitalize">{c.device}</td>
        <td>{c.country ?? '—'}</td>
      </tr>
    ))}
  </tbody>
</table>
```

7. **UTM note** at bottom:
```tsx
<div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-sm text-zinc-400">
  <span className="font-bold text-white">GA4 Cross-Reference:</span> 
  Your Google Analytics shows this traffic under 
  Source: <code>prompthub</code> / Medium: <code>banner</code> / 
  Campaign: <code>{stats.utm_campaign ?? campaign_name}</code>.
</div>
```

---

## Verification Checklist

- [ ] Page has `noindex` meta tag via `generateMetadata`
- [ ] "Data updated hourly" visible in header
- [ ] Unique impressions, unique clicks, frequency shown below headline numbers
- [ ] Benchmark callout box renders with dynamic CTR comparison
- [ ] Click verification section renders
- [ ] Last 20 clicks table shows timestamp, device, country (no PII)
- [ ] UTM note renders with correct campaign name
- [ ] API returns `unique_impressions`, `unique_clicks`, `frequency`, `last_clicks`
