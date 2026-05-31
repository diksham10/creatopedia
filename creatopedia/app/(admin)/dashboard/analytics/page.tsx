'use client'

import { useState } from 'react'
import Link from 'next/link'
import AnalyticsChart from '@/components/dashboard/AnalyticsChart'
import RefreshStatsButton from '@/components/dashboard/RefreshStatsButton'
import { AnalyticsOverviewResponse, TopPromptData, TopCampaignData } from '@/lib/analytics/types'
import { useQuery } from '@tanstack/react-query'

export default function AnalyticsPage() {
  const [range, setRange] = useState('30d')
  const [month, setMonth] = useState('')
  const [search, setSearch] = useState('')
  const [gateType, setGateType] = useState('')
  const [categoryId, setCategoryId] = useState('')

  // Fetch categories with caching
  const { data: categories = [] } = useQuery<{ id: string, name: string }[]>({
    queryKey: ['categories'],
    queryFn: () => fetch('/api/categories').then(res => res.json()),
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
  })

  // Fetch analytics data — pass JWT so the Next.js proxy can forward it
  const params = new URLSearchParams({
    range,
    month,
    search,
    gate_type: gateType,
    category_id: categoryId,
  })

  const { data, isLoading: loading } = useQuery<AnalyticsOverviewResponse>({
    queryKey: ['analytics', range, month, search, gateType, categoryId],
    queryFn: () => {
      return fetch(`/api/analytics/overview?${params.toString()}`).then(res => res.json())
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  function handleRangeChange(r: string) {
    setRange(r)
    setMonth('')
  }

  function handleMonthChange(m: string) {
    setMonth(m)
    setRange('')
  }

  // Generate last 12 months for dropdown
  const months = []
  const date = new Date()
  date.setDate(1) // Set to the 1st to avoid month-skipping issues (e.g. Feb 30 -> Mar 2)
  for (let i = 0; i < 12; i++) {
    const m = date.getMonth() + 1
    const y = date.getFullYear()
    const value = `${y}-${m.toString().padStart(2, '0')}`
    const label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    months.push({ value, label })
    date.setMonth(date.getMonth() - 1)
  }

  if (!data) {
    return <div className="p-10 text-center text-zinc-500">Loading analytics...</div>
  }

  // Handle case where the API returned an error (e.g. { error: "Unauthorized" })
  if ('error' in data || !data.summary) {
    return (
      <div className="p-10 text-center">
        <div className="text-red-400 mb-2">Failed to load analytics</div>
        <div className="text-zinc-500 text-sm">
          {/* @ts-ignore */}
          {data.error || 'Invalid data format returned from server.'}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold text-white tracking-tight">Analytics Overview</h1>
          <p className="text-zinc-500 text-sm">Track your prompt performance and audience growth.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <RefreshStatsButton />
          
          <input 
            type="text" 
            placeholder="Search prompts..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-1.5 text-xs font-semibold text-white focus:outline-none focus:border-indigo-500 transition-colors w-full sm:w-48"
          />

          <select
            value={gateType}
            onChange={(e) => setGateType(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs font-semibold text-zinc-400 focus:outline-none focus:border-indigo-500 transition-colors"
          >
            <option value="">All Gates</option>
            <option value="open">Open</option>
            <option value="email">Email</option>
            <option value="payment">Payment</option>
          </select>

          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs font-semibold text-zinc-400 focus:outline-none focus:border-indigo-500 transition-colors max-w-[150px]"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select
            value={month}
            onChange={(e) => handleMonthChange(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs font-semibold text-zinc-400 focus:outline-none focus:border-indigo-500 transition-colors"
          >
            <option value="">Select Month</option>
            {months.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>

          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-1 flex gap-1">
            {['7d', '14d', '30d', '90d', 'all'].map((r) => (
              <button
                key={r}
                onClick={() => handleRangeChange(r)}
                className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  range === r ? 'bg-indigo-500 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
              >
                {r === 'all' ? 'All Time' : r.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
    </div>

      {loading && <div className="opacity-50 pointer-events-none transition-opacity">Updating...</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard title="Total Views" value={data.summary.total_views} change={data.summary.views_change_pct} />
        <SummaryCard title="Unique Visitors" value={data.summary.unique_visitors} change={data.summary.visitors_change_pct} />
        <SummaryCard title="Conversions" value={data.summary.total_conversions} change={data.summary.conversions_change_pct} />
        <SummaryCard title="Revenue" value={`$${(data.summary.total_revenue).toFixed(2)}`} change={data.summary.revenue_change_pct} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <section className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-xl">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-bold text-white">Daily Views</h2>
          </div>
          <AnalyticsChart type="line" data={data?.daily_views?.map((d) => ({ date: d.date, views: d.views })) || []} />
        </section>

        <section className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-xl">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-bold text-white">Conversion Funnel</h2>
          </div>
          <div className="space-y-6 mt-4">
            <FunnelStep label="Total Views" value={data.funnel.views} max={data.funnel.views} color="bg-indigo-500" />
            <FunnelStep label="Email Submissions" value={data.funnel.email_submissions} max={data.funnel.views} color="bg-emerald-500" />
            <FunnelStep label="Prompt Unlocks" value={data.funnel.prompt_unlocks} max={data.funnel.views} color="bg-amber-500" />
            <FunnelStep label="Copies" value={data.funnel.copies} max={data.funnel.views} color="bg-purple-500" />
          </div>
        </section>
      </div>

      <section className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="px-8 py-6 border-b border-zinc-800">
          <h2 className="text-lg font-bold text-white">Traffic Sources</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-zinc-900/50">
                <th className="text-left px-8 py-4 text-xs font-semibold text-zinc-500 uppercase">Referrer</th>
                <th className="text-right px-8 py-4 text-xs font-semibold text-zinc-500 uppercase">Sessions</th>
                <th className="text-right px-8 py-4 text-xs font-semibold text-zinc-500 uppercase">% of Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {(data.traffic_sources || []).map((t, i) => (
                <tr key={i} className="hover:bg-zinc-800/30">
                  <td className="px-8 py-4 text-white">{t.source}</td>
                  <td className="px-8 py-4 text-right text-zinc-400 font-mono">{t.sessions.toLocaleString()}</td>
                  <td className="px-8 py-4 text-right font-mono text-zinc-400">{t.pct.toFixed(1)}%</td>
                </tr>
              ))}
              {(!data.traffic_sources || data.traffic_sources.length === 0) && (
                <tr><td colSpan={3} className="px-8 py-10 text-center text-zinc-500">No traffic sources recorded yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <TopPromptsTable data={data.top_prompts} />
        <TopCampaignsTable data={data.top_campaigns} />
      </div>
    </div>
  )
}

function SummaryCard({ title, value, change }: { title: string, value: string | number, change: number }) {
  const isPositive = change >= 0
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl">
      <div className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-2">{title}</div>
      <div className="text-3xl font-bold text-white mb-2">{value.toLocaleString()}</div>
      <div className={`text-xs font-bold flex items-center gap-1 ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
        {isPositive ? '↗' : '↘'} {Math.abs(change).toFixed(1)}% <span className="text-zinc-600 font-normal">vs previous</span>
      </div>
    </div>
  )
}

function FunnelStep({ label, value, max, color }: { label: string, value: number, max: number, color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div>
      <div className="flex justify-between text-sm font-semibold mb-2">
        <span className="text-zinc-300">{label}</span>
        <span className="text-white">{value.toLocaleString()} <span className="text-zinc-600 ml-1">({pct.toFixed(1)}%)</span></span>
      </div>
      <div className="h-3 rounded-full bg-zinc-800 overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-1000`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function TopPromptsTable({ data }: { data: TopPromptData[] }) {
  return (
    <section className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-xl flex flex-col">
      <div className="px-8 py-6 border-b border-zinc-800 flex justify-between items-center">
        <h2 className="text-lg font-bold text-white">Top Prompts</h2>
      </div>
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-zinc-900/50">
              <th className="text-left px-6 py-4 text-xs font-semibold text-zinc-500 uppercase">Prompt</th>
              <th className="text-right px-6 py-4 text-xs font-semibold text-zinc-500 uppercase">Views</th>
              <th className="text-right px-6 py-4 text-xs font-semibold text-zinc-500 uppercase">Conv.</th>
              <th className="text-right px-6 py-4 text-xs font-semibold text-zinc-500 uppercase"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {data.map((p) => (
              <tr key={p.id} className="hover:bg-zinc-800/30">
                <td className="px-6 py-4">
                  <div className="font-semibold text-white truncate max-w-[150px]">{p.title}</div>
                  <div className="text-xs text-zinc-500">{p.gate_type}</div>
                </td>
                <td className="px-6 py-4 text-right font-mono text-zinc-400">{p.views.toLocaleString()}</td>
                <td className="px-6 py-4 text-right font-mono text-indigo-400 font-bold">{p.conv_rate.toFixed(1)}%</td>
                <td className="px-6 py-4 text-right">
                  <Link href={`/dashboard/analytics/prompts/${p.id}`} className="text-xs font-bold text-indigo-400 hover:text-indigo-300">
                    View ↗
                  </Link>
                </td>
              </tr>
            ))}
            {data.length === 0 && <tr><td colSpan={4} className="px-6 py-10 text-center text-zinc-500">No data.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function TopCampaignsTable({ data }: { data: TopCampaignData[] }) {
  return (
    <section className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-xl flex flex-col">
      <div className="px-8 py-6 border-b border-zinc-800 flex justify-between items-center">
        <h2 className="text-lg font-bold text-white">Top Campaigns</h2>
      </div>
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-zinc-900/50">
              <th className="text-left px-6 py-4 text-xs font-semibold text-zinc-500 uppercase">Campaign</th>
              <th className="text-right px-6 py-4 text-xs font-semibold text-zinc-500 uppercase">Imps</th>
              <th className="text-right px-6 py-4 text-xs font-semibold text-zinc-500 uppercase">CTR</th>
              <th className="text-right px-6 py-4 text-xs font-semibold text-zinc-500 uppercase"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {data.map((c) => (
              <tr key={c.id} className="hover:bg-zinc-800/30">
                <td className="px-6 py-4">
                  <div className="font-semibold text-white truncate max-w-[150px]">{c.name}</div>
                  <div className="text-xs text-zinc-500 uppercase">{c.status}</div>
                </td>
                <td className="px-6 py-4 text-right font-mono text-zinc-400">{c.impressions.toLocaleString()}</td>
                <td className="px-6 py-4 text-right font-mono text-indigo-400 font-bold">{c.ctr.toFixed(1)}%</td>
                <td className="px-6 py-4 text-right">
                  <Link href={`/dashboard/analytics/campaigns/${c.id}`} className="text-xs font-bold text-indigo-400 hover:text-indigo-300">
                    View ↗
                  </Link>
                </td>
              </tr>
            ))}
            {data.length === 0 && <tr><td colSpan={4} className="px-6 py-10 text-center text-zinc-500">No campaigns.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  )
}
