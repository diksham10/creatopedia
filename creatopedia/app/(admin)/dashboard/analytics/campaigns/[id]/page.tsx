'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import AnalyticsChart from '@/components/dashboard/AnalyticsChart'
import RefreshStatsButton from '@/components/dashboard/RefreshStatsButton'
import { CampaignAnalyticsResponse } from '@/lib/analytics/types'
import { useQuery } from '@tanstack/react-query'

export default function CampaignAnalyticsPage() {
  const params = useParams()
  const id = params?.id as string

  const [range, setRange] = useState('7d')
  const [month, setMonth] = useState('')
  const [copied, setCopied] = useState(false)

  const { data, isLoading: loading, error: queryError } = useQuery<CampaignAnalyticsResponse>({
    queryKey: ['analytics', 'campaign', id, range, month],
    queryFn: () => fetch(`/api/analytics/campaigns/${id}?range=${range}&month=${month}`).then(res => {
      if (!res.ok) throw new Error('Failed to load data')
      return res.json()
    }),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  function handleRangeChange(r: string) {
    setRange(r)
    setMonth('') // Clear month when a range preset is clicked
  }

  function handleMonthChange(m: string) {
    setMonth(m)
    setRange('') // Clear range preset when a month is selected
  }

  // Generate last 12 months for dropdown
  const months = []
  const date = new Date()
  for (let i = 0; i < 12; i++) {
    const m = date.getMonth() + 1
    const y = date.getFullYear()
    const value = `${y}-${m.toString().padStart(2, '0')}`
    const label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    months.push({ value, label })
    date.setMonth(date.getMonth() - 1)
  }

  function handleCopyReportLink() {
    if (!data?.campaign?.report_token) return
    const url = `${window.location.origin}/ads/report/${data.campaign.report_token}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  if (queryError) {
    return <div className="p-10 text-center text-red-400 font-bold">{(queryError as Error).message}</div>
  }

  if (!data) {
    return <div className="p-10 text-center text-zinc-500">Loading campaign analytics...</div>
  }

  const { campaign, summary, daily, placement_breakdown, device_breakdown, country_breakdown, hourly_heatmap, click_timeline } = data

  // Find max clicks for heatmap scaling
  const maxHeatmapClicks = hourly_heatmap ? Math.max(...hourly_heatmap.map((h) => h.clicks)) : 0

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div>
        <Link href="/dashboard/analytics" className="text-zinc-500 hover:text-white transition-colors text-sm font-semibold flex items-center gap-2 mb-6 group">
          <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
          Back to Analytics
        </Link>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-white tracking-tight">{campaign?.name}</h1>
              {campaign?.status && (
                <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md border ${campaign.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                    campaign.status === 'paused' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                      'bg-zinc-800 text-zinc-400 border-zinc-700'
                  }`}>
                  {campaign.status}
                </span>
              )}
            </div>
            <p className="text-zinc-500 text-sm font-semibold">Client: <span className="text-zinc-300">{campaign?.client_name}</span></p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleCopyReportLink}
              className="px-4 py-1.5 text-sm font-semibold bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors flex items-center gap-2 border border-zinc-700"
            >
              {copied ? 'Copied!' : 'Share Report Link'}
            </button>
            <RefreshStatsButton />

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
                  className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${range === r ? 'bg-indigo-500 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                    }`}
                >
                  {r === 'all' ? 'All Time' : r.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {loading && <div className="opacity-50 pointer-events-none transition-opacity">Updating...</div>}

      <div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <SummaryCard 
            title="Ad Impressions" 
            value={summary.impressions} 
            change={summary.impressions_change_pct} 
            description="Total times the ad was seen"
          />
          <SummaryCard 
            title="Clicks" 
            value={summary.clicks} 
            change={summary.clicks_change_pct} 
            description="Total times people clicked"
          />
          <SummaryCard 
            title="CTR" 
            value={`${summary.ctr.toFixed(2)}%`} 
            change={summary.ctr_change_pct} 
            description="Click-through rate (Clicks/Impressions)"
          />
          <SummaryCard 
            title="Frequency" 
            value={`${summary.frequency.toFixed(2)}x`} 
            change={summary.frequency_change_pct} 
            description="Avg. times each person saw the ad"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          <SummaryCard 
            title="Total Page Views" 
            value={summary.total_prompt_views} 
            change={0} 
            description="Total traffic on prompts running this ad"
          />
          <SummaryCard 
            title="Ad Fill Rate" 
            value={`${(summary.total_prompt_views > 0 ? (summary.impressions / summary.total_prompt_views) * 100 : 0).toFixed(1)}%`} 
            change={0} 
            description="% of page views that showed the ad"
          />
          <SummaryCard 
            title="Revenue (Est.)" 
            value="$0.00" 
            change={0} 
            description="Estimated ad earnings"
          />
        </div>
        <div className="mt-3 text-right text-xs text-zinc-500 font-semibold">
          Industry average CTR for display ads: <span className="text-zinc-300">0.5% – 2.0%</span>
        </div>
      </div>

      <section className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-xl">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-lg font-bold text-white">Daily Performance</h2>
        </div>
        {/* We use a bar chart for impressions and we can optionally map clicks too, or just map clicks for clarity */}
        <AnalyticsChart 
          type="bar" 
          data={daily || []} 
          series={[
            { key: 'impressions', color: '#6366f1', name: 'Ad Impressions' },
            { key: 'clicks', color: '#10b981', name: 'Ad Clicks' }
          ]}
        />
      </section>

      <section className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="px-8 py-6 border-b border-zinc-800">
          <h2 className="text-lg font-bold text-white">Placement Breakdown</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-zinc-900/50">
                <th className="text-left px-8 py-4 text-xs font-semibold text-zinc-500 uppercase">Prompt</th>
                <th className="text-right px-8 py-4 text-xs font-semibold text-zinc-500 uppercase">Page Views</th>
                <th className="text-right px-8 py-4 text-xs font-semibold text-zinc-500 uppercase">Ad Imps</th>
                <th className="text-right px-8 py-4 text-xs font-semibold text-zinc-500 uppercase">Clicks</th>
                <th className="text-right px-8 py-4 text-xs font-semibold text-zinc-500 uppercase">CTR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {(placement_breakdown || []).map((p) => (
                <tr key={p.prompt_id} className="hover:bg-zinc-800/30">
                  <td className="px-8 py-4">
                    <div className="font-semibold text-white truncate max-w-[250px]">{p.prompt_title}</div>
                    {p.prompt_slug && (
                      <Link href={`/dashboard/analytics/prompts/${p.prompt_id}`} className="text-xs text-indigo-400 hover:text-indigo-300">
                        View Details ↗
                      </Link>
                    )}
                  </td>
                  <td className="px-8 py-4 text-right text-zinc-400 font-mono">{p.views.toLocaleString()}</td>
                  <td className="px-8 py-4 text-right text-indigo-400/80 font-mono font-bold">{p.impressions.toLocaleString()}</td>
                  <td className="px-8 py-4 text-right text-zinc-400 font-mono">{p.clicks.toLocaleString()}</td>
                  <td className={`px-8 py-4 text-right font-mono font-bold ${p.ctr > 5 ? 'text-emerald-400' : p.ctr >= 2 ? 'text-amber-400' : 'text-red-400'}`}>
                    {p.ctr.toFixed(2)}%
                  </td>
                </tr>
              ))}
              {(!placement_breakdown || placement_breakdown.length === 0) && (
                <tr><td colSpan={5} className="px-8 py-10 text-center text-zinc-500">No placements recorded yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <section className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-xl lg:col-span-1">
          <div className="px-8 py-6 border-b border-zinc-800">
            <h2 className="text-lg font-bold text-white">Device Split</h2>
          </div>
          <div className="p-8 space-y-6">
            {(device_breakdown || []).map((d, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm font-semibold mb-2 capitalize">
                  <span className="text-zinc-300">{d.device}</span>
                  <span className="text-white">{d.count.toLocaleString()} <span className="text-zinc-500 ml-1">({d.pct.toFixed(1)}%)</span></span>
                </div>
                <div className="h-3 rounded-full bg-zinc-800 overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full transition-all duration-1000" style={{ width: `${d.pct}%` }} />
                </div>
              </div>
            ))}
            {(!device_breakdown || device_breakdown.length === 0) && (
              <div className="text-center text-zinc-500 py-10">No device data yet.</div>
            )}
          </div>
        </section>

        <section className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-xl lg:col-span-1">
          <div className="px-8 py-6 border-b border-zinc-800">
            <h2 className="text-lg font-bold text-white">Top Countries</h2>
          </div>
          <div className="p-8 space-y-4">
            {(country_breakdown || []).map((c, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-zinc-600 font-mono text-xs">{i + 1}.</span>
                  <span className="text-zinc-300 font-semibold text-sm">{c.country}</span>
                </div>
                <div className="text-right">
                  <div className="text-white font-mono text-sm">{c.pct.toFixed(1)}%</div>
                </div>
              </div>
            ))}
            {(!country_breakdown || country_breakdown.length === 0) && (
              <div className="text-center text-zinc-500 py-10">No country data yet.</div>
            )}
          </div>
        </section>

        <section className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-xl lg:col-span-1">
          <div className="px-8 py-6 border-b border-zinc-800">
            <h2 className="text-lg font-bold text-white">Click Heatmap (UTC)</h2>
          </div>
          <div className="p-6 overflow-x-auto">
            <div className="grid grid-cols-25 gap-1 min-w-[500px]">
              {/* Header row (hours) */}
              <div className="text-[10px] text-zinc-600 font-mono text-right pr-2">Day</div>
              {Array.from({ length: 24 }).map((_, i) => (
                <div key={i} className="text-[9px] text-zinc-600 text-center font-mono">
                  {i % 4 === 0 ? i : ''}
                </div>
              ))}

              {/* Heatmap rows */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((dayName, dayIndex) => (
                <div key={dayIndex} className="contents">
                  <div className="text-[10px] text-zinc-500 font-mono text-right pr-2 self-center">{dayName}</div>
                  {Array.from({ length: 24 }).map((_, hourIndex) => {
                    const cellData = hourly_heatmap?.find((h) => h.day === dayIndex && h.hour === hourIndex)
                    const clicks = cellData?.clicks || 0
                    const opacity = maxHeatmapClicks > 0 ? clicks / maxHeatmapClicks : 0
                    return (
                      <div
                        key={hourIndex}
                        title={`${clicks} clicks`}
                        className="aspect-square rounded-sm bg-indigo-500"
                        style={{ opacity: opacity === 0 ? 0.05 : Math.max(0.2, opacity) }}
                      />
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <section className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="px-8 py-6 border-b border-zinc-800">
          <h2 className="text-lg font-bold text-white">Recent Clicks <span className="text-zinc-500 font-normal text-sm ml-2">(Last 50)</span></h2>
        </div>
        <div className="overflow-x-auto h-[400px]">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-zinc-900">
              <tr className="bg-zinc-900/50">
                <th className="text-left px-8 py-4 text-xs font-semibold text-zinc-500 uppercase">Timestamp (UTC)</th>
                <th className="text-left px-8 py-4 text-xs font-semibold text-zinc-500 uppercase">Placement</th>
                <th className="text-left px-8 py-4 text-xs font-semibold text-zinc-500 uppercase">Device</th>
                <th className="text-left px-8 py-4 text-xs font-semibold text-zinc-500 uppercase">Country</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {(click_timeline || []).map((c, i) => (
                <tr key={i} className="hover:bg-zinc-800/30">
                  <td className="px-8 py-4 text-zinc-400 font-mono">{new Date(c.timestamp).toUTCString()}</td>
                  <td className="px-8 py-4 text-white">{c.prompt_title}</td>
                  <td className="px-8 py-4 text-zinc-300 capitalize">{c.device}</td>
                  <td className="px-8 py-4 text-zinc-300">{c.country}</td>
                </tr>
              ))}
              {(!click_timeline || click_timeline.length === 0) && (
                <tr><td colSpan={4} className="px-8 py-10 text-center text-zinc-500">No clicks recorded yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function SummaryCard({ title, value, change, description }: { title: string, value: string | number, change: number, description?: string }) {
  const isPositive = change >= 0
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
      <div>
        <div className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-1 flex items-center justify-between">
          {title}
        </div>
        {description && <div className="text-[10px] text-zinc-600 mb-4 font-medium">{description}</div>}
        <div className="text-3xl font-bold text-white mb-2">{typeof value === 'number' ? value.toLocaleString() : value}</div>
      </div>
      {change !== 0 && (
        <div className={`text-xs font-bold flex items-center gap-1 ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
          {isPositive ? '↗' : '↘'} {Math.abs(change).toFixed(1)}% <span className="text-zinc-600 font-normal">vs previous</span>
        </div>
      )}
    </div>
  )
}
