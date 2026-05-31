'use client'

import React from 'react'
import AnalyticsChart from '@/components/dashboard/AnalyticsChart'
import { AdReportResponse } from '@/lib/analytics/types'
import { useSearchParams, usePathname, useRouter } from 'next/navigation'

interface AdReportContentProps {
  stats: AdReportResponse
}

export default function AdReportContent({ stats }: AdReportContentProps) {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()
  const currentRange = searchParams.get('range') || '30d'
  const currentMonth = searchParams.get('month') || ''

  const setRange = (range: string) => {
    const params = new URLSearchParams(searchParams)
    params.set('range', range)
    params.delete('month')
    router.push(`${pathname}?${params.toString()}`)
  }

  const setMonth = (month: string) => {
    const params = new URLSearchParams(searchParams)
    if (month) {
      params.set('month', month)
      params.delete('range')
    } else {
      params.delete('month')
      params.set('range', '30d')
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  const months = []
  const startMonth = new Date(2024, 0, 1) // Start from Jan 2024
  const now = new Date()
  const m = new Date(now.getFullYear(), now.getMonth(), 1)
  while (m >= startMonth) {
    months.push({
      label: m.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      value: `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}`
    })
    m.setMonth(m.getMonth() - 1)
  }

  const summary = {
    impressions: stats?.total_impressions ?? 0,
    unique_impressions: stats?.total_unique_impressions ?? 0,
    clicks: stats?.total_clicks ?? 0,
    unique_clicks: stats?.total_unique_clicks ?? 0,
    ctr: stats?.ctr ?? 0,
    frequency: stats?.frequency ?? 0,
    total_prompt_views: stats?.total_prompt_views ?? 0,
  }

  const fillRate = summary.total_prompt_views > 0
    ? (summary.impressions / summary.total_prompt_views) * 100
    : 0

  return (
    <div className="space-y-12">
      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-4">
        <div className="flex items-center bg-zinc-900/50 border border-zinc-800 p-1 rounded-xl backdrop-blur-md">
          {['7d', '14d', '30d', '90d', 'all'].map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${currentRange === r && !currentMonth
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
                }`}
            >
              {r.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Select Month</span>
          <select
            value={currentMonth}
            onChange={(e) => setMonth(e.target.value)}
            className="bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-2 text-xs font-bold text-white outline-none focus:ring-2 focus:ring-indigo-500/20 backdrop-blur-md appearance-none min-w-[180px] cursor-pointer"
          >
            <option value="">Choose Month...</option>
            {months.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-6">
        <SummaryCard
          title="Impressions"
          value={summary.impressions.toLocaleString()}
          description="Total ad views"
        />
        <SummaryCard
          title="Clicks"
          value={summary.clicks.toLocaleString()}
          description="Total ad interactions"
          highlight
        />
        <SummaryCard
          title="CTR"
          value={`${(summary.ctr || 0).toFixed(2)}%`}
          description="Click-through rate"
        />
        <SummaryCard
          title="Frequency"
          value={`${(summary.frequency || 0).toFixed(2)}x`}
          description="Avg. views per person"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <SummaryCard
          title="Total Page Views"
          value={summary.total_prompt_views.toLocaleString()}
          description="Traffic on pages with this ad"
        />
        <SummaryCard
          title="Ad Fill Rate"
          value={`${(fillRate || 0).toFixed(1)}%`}
          description="% of page views showing ad"
        />
        <SummaryCard
          title="Active Since"
          value={stats.starts_at ? new Date(stats.starts_at).toLocaleDateString() : '—'}
          description="Campaign start date"
        />
      </div>

      {/* Daily Performance Chart */}
      <section className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 backdrop-blur-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Daily Performance</h2>
            <p className="text-zinc-500 text-sm mt-1">Impressions and clicks over the last 30 days</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
              <span className="text-zinc-400">Impressions</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              <span className="text-zinc-400">Clicks</span>
            </div>
          </div>
        </div>
        <div className="h-[350px] w-full">
          <AnalyticsChart
            type="line"
            data={stats?.daily_breakdown ?? []}
            series={[
              { key: 'impressions', name: 'Impressions', color: '#6366f1' },
              { key: 'clicks', name: 'Clicks', color: '#10b981' }
            ]}
          />
        </div>
      </section>

      {/* Main Stats and Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Placement Table */}
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-zinc-900/50 border border-zinc-800 rounded-3xl overflow-hidden backdrop-blur-sm">
            <div className="px-8 py-6 border-b border-zinc-800 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white tracking-tight">Top Placements</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-zinc-500 border-b border-zinc-800 bg-zinc-900/30">
                    <th className="text-left px-8 py-4 font-semibold uppercase tracking-wider text-[10px]">Prompt / Page</th>
                    <th className="text-right px-4 py-4 font-semibold uppercase tracking-wider text-[10px]">Views</th>
                    <th className="text-right px-4 py-4 font-semibold uppercase tracking-wider text-[10px]">Imps</th>
                    <th className="text-right px-4 py-4 font-semibold uppercase tracking-wider text-[10px]">Clicks</th>
                    <th className="text-right px-8 py-4 font-semibold uppercase tracking-wider text-[10px]">CTR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {(stats?.per_prompt_breakdown ?? []).map((p) => (
                    <tr key={p.prompt_id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-8 py-5">
                        <div className="font-bold text-zinc-200 group-hover:text-white transition-colors">{p.title}</div>
                        <div className="text-[10px] text-zinc-600 font-mono mt-1 uppercase tracking-tight">{p.prompt_id.slice(0, 8)}...</div>
                      </td>
                      <td className="px-4 py-5 text-right font-mono text-zinc-400">{(p.views || 0).toLocaleString()}</td>
                      <td className="px-4 py-5 text-right font-mono text-zinc-400">{p.impressions.toLocaleString()}</td>
                      <td className="px-4 py-5 text-right font-mono text-zinc-400">{p.clicks.toLocaleString()}</td>
                      <td className="px-8 py-5 text-right">
                        <span className="font-mono text-emerald-400 font-bold bg-emerald-400/10 px-2 py-1 rounded text-xs">
                          {p.ctr.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Side Breakdowns */}
        <div className="space-y-8">
          <section className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 backdrop-blur-sm">
            <h2 className="text-lg font-bold text-white mb-6 tracking-tight">Device Mix</h2>
            <div className="space-y-6">
              {(stats?.device_breakdown ?? []).map((d) => (
                <div key={d.device} className="group">
                  <div className="flex justify-between text-sm font-bold mb-2 tracking-tight">
                    <span className="text-zinc-400 group-hover:text-zinc-200 transition-colors capitalize">{d.device}</span>
                    <span className="text-white font-mono">{d.percentage}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-zinc-800/50 overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(99,102,241,0.4)]"
                      style={{ width: `${d.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 backdrop-blur-sm">
            <h2 className="text-lg font-bold text-white mb-6 tracking-tight">Top Regions</h2>
            <div className="space-y-5">
              {(stats?.country_breakdown ?? []).map((c, i: number) => (
                <div key={c.country} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-zinc-700 w-4">{i + 1}.</span>
                    <span className="text-sm font-semibold text-zinc-400 group-hover:text-zinc-200 transition-colors truncate max-w-[120px]">{c.country}</span>
                  </div>
                  <span className="text-xs font-bold text-white bg-zinc-800 px-2 py-1 rounded font-mono">{c.percentage}%</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

function SummaryCard({ title, value, description, highlight = false }: { title: string, value: string | number, description: string, highlight?: boolean }) {
  return (
    <div className={`p-8 rounded-3xl border transition-all hover:scale-[1.02] duration-300 ${highlight
        ? 'bg-indigo-600/10 border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.05)]'
        : 'bg-zinc-900/50 border-zinc-800/50'
      }`}>
      <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-3">{title}</p>
      <div className="flex items-baseline gap-2">
        <p className={`text-4xl font-black tracking-tight ${highlight ? 'text-indigo-400' : 'text-white'}`}>{value}</p>
      </div>
      <p className="text-zinc-600 text-xs mt-3 font-medium">{description}</p>
    </div>
  )
}
