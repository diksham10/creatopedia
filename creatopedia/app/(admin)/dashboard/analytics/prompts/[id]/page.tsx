'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import AnalyticsChart from '@/components/dashboard/AnalyticsChart'
import RefreshStatsButton from '@/components/dashboard/RefreshStatsButton'
import { PromptAnalyticsResponse } from '@/lib/analytics/types'
import { useQuery } from '@tanstack/react-query'

export default function PromptAnalyticsPage() {
  const params = useParams()
  const id = params?.id as string

  const [range, setRange] = useState('7d')

  const { data, isLoading: loading, error: queryError } = useQuery<PromptAnalyticsResponse>({
    queryKey: ['analytics', 'prompt', id, range],
    queryFn: () => fetch(`/api/analytics/prompts/${id}?range=${range}`).then(res => {
      if (!res.ok) throw new Error('Failed to load data')
      return res.json()
    }),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  function handleRangeChange(r: string) {
    setRange(r)
  }

  if (queryError) {
    return <div className="p-10 text-center text-red-400 font-bold">{(queryError as Error).message}</div>
  }

  if (!data) {
    return <div className="p-10 text-center text-zinc-500">Loading prompt analytics...</div>
  }

  const { prompt, summary, daily, funnel, traffic_sources, device_breakdown, ads, email_captures } = data

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div>
        <Link href="/dashboard/analytics" className="text-zinc-500 hover:text-white transition-colors text-sm font-semibold flex items-center gap-2 mb-6 group">
          <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
          Back to Analytics
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-white tracking-tight">{prompt?.title}</h1>
              {prompt?.ai_tool && (
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-zinc-800 text-zinc-400 rounded-md border border-zinc-700">
                  {prompt.ai_tool}
                </span>
              )}
              {prompt?.gate_type && (
                <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md border ${
                  prompt.gate_type === 'email' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                  prompt.gate_type === 'payment' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                  'bg-zinc-800 text-zinc-400 border-zinc-700'
                }`}>
                  {prompt.gate_type} Gate
                </span>
              )}
            </div>
            <p className="text-zinc-500 text-sm font-mono">/{prompt?.slug}</p>
          </div>
          <div className="flex items-center gap-4">
            <RefreshStatsButton />
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-1 flex gap-1">
            {['7d', '14d', '30d'].map((r) => (
              <button
                key={r}
                onClick={() => handleRangeChange(r)}
                className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  range === r ? 'bg-indigo-500 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
              >
                {r.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>

      {loading && <div className="opacity-50 pointer-events-none transition-opacity">Updating...</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard title="Views" value={summary?.views || 0} change={summary?.views_change_pct || 0} />
        <SummaryCard title="Copies" value={summary?.copies || 0} change={summary?.copies_change_pct || 0} />
        {prompt?.gate_type !== 'open' && (
          <>
            <SummaryCard title="Email Captures" value={summary?.email_captures || 0} change={summary?.email_captures_change_pct || 0} />
            <SummaryCard title="Unlocks" value={summary?.unlocks || 0} change={summary?.unlocks_change_pct || 0} />
          </>
        )}
        <SummaryCard title="Revenue" value={`$${(summary?.revenue || 0).toFixed(2)}`} change={summary?.revenue_change_pct || 0} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <section className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-xl">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-bold text-white">Daily Performance</h2>
          </div>
          <AnalyticsChart type="line" data={daily?.map((d) => ({ date: d.date, views: d.views, conversions: d.conversions })) || []} />
        </section>

        <section className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-xl">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-bold text-white">Conversion Funnel</h2>
          </div>
          <div className="space-y-6 mt-4">
            <FunnelStep label="Views" value={funnel?.views || 0} max={funnel?.views || 1} color="bg-indigo-500" />
            
            {prompt?.gate_type === 'email' && (
              <FunnelStep label="Email Submissions" value={funnel?.email_submissions || 0} max={funnel?.views || 1} color="bg-emerald-500" />
            )}
            
            {(prompt?.gate_type === 'email' || prompt?.gate_type === 'payment') && (
              <FunnelStep label="Prompt Unlocks" value={funnel?.prompt_unlocks || 0} max={funnel?.views || 1} color="bg-amber-500" />
            )}
            
            <FunnelStep label="Copies" value={funnel?.copies || 0} max={funnel?.views || 1} color="bg-purple-500" />
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <section className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="px-8 py-6 border-b border-zinc-800">
            <h2 className="text-lg font-bold text-white">Traffic Sources</h2>
          </div>
          <div className="overflow-x-auto h-[300px]">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-zinc-900">
                <tr className="bg-zinc-900/50">
                  <th className="text-left px-8 py-4 text-xs font-semibold text-zinc-500 uppercase">Referrer</th>
                  <th className="text-right px-8 py-4 text-xs font-semibold text-zinc-500 uppercase">Sessions</th>
                  <th className="text-right px-8 py-4 text-xs font-semibold text-zinc-500 uppercase">%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {(traffic_sources || []).map((t, i) => (
                  <tr key={i} className="hover:bg-zinc-800/30">
                    <td className="px-8 py-4 text-white truncate max-w-[200px]">{t.source}</td>
                    <td className="px-8 py-4 text-right text-zinc-400 font-mono">{t.sessions.toLocaleString()}</td>
                    <td className="px-8 py-4 text-right font-mono text-zinc-400">{t.pct.toFixed(1)}%</td>
                  </tr>
                ))}
                {(!traffic_sources || traffic_sources.length === 0) && (
                  <tr><td colSpan={3} className="px-8 py-10 text-center text-zinc-500">No traffic sources recorded yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="px-8 py-6 border-b border-zinc-800">
            <h2 className="text-lg font-bold text-white">Device Breakdown</h2>
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
      </div>

      <section className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="px-8 py-6 border-b border-zinc-800">
          <h2 className="text-lg font-bold text-white">Ads on this Page</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-zinc-900/50">
                <th className="text-left px-8 py-4 text-xs font-semibold text-zinc-500 uppercase">Campaign</th>
                <th className="text-right px-8 py-4 text-xs font-semibold text-zinc-500 uppercase">Impressions</th>
                <th className="text-right px-8 py-4 text-xs font-semibold text-zinc-500 uppercase">Clicks</th>
                <th className="text-right px-8 py-4 text-xs font-semibold text-zinc-500 uppercase">CTR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {(ads || []).map((a) => (
                <tr key={a.campaign_id} className="hover:bg-zinc-800/30 group">
                  <td className="px-8 py-4 text-white font-medium">
                    <Link 
                      href={`/dashboard/analytics/campaigns/${a.campaign_id}`}
                      className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      {a.campaign_name}
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity">↗</span>
                    </Link>
                  </td>
                  <td className="px-8 py-4 text-right text-zinc-400 font-mono">{a.impressions.toLocaleString()}</td>
                  <td className="px-8 py-4 text-right text-zinc-400 font-mono">{a.clicks.toLocaleString()}</td>
                  <td className={`px-8 py-4 text-right font-mono font-bold ${a.ctr > 5 ? 'text-emerald-400' : a.ctr >= 2 ? 'text-amber-400' : 'text-red-400'}`}>
                    {a.ctr.toFixed(2)}%
                  </td>
                </tr>
              ))}
              {(!ads || ads.length === 0) && (
                <tr><td colSpan={4} className="px-8 py-10 text-center text-zinc-500">No ads displayed on this prompt yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {prompt?.gate_type !== 'open' && (
        <section className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="flex items-center justify-between px-8 py-6 border-b border-zinc-800">
            <h2 className="text-lg font-bold text-white">Recent Email Captures</h2>
          </div>
          <div className="overflow-x-auto h-[400px]">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-zinc-900">
                <tr className="bg-zinc-900/50">
                  <th className="text-left px-8 py-4 text-xs font-semibold text-zinc-500 uppercase">Email</th>
                  <th className="text-left px-8 py-4 text-xs font-semibold text-zinc-500 uppercase">Source</th>
                  <th className="text-right px-8 py-4 text-xs font-semibold text-zinc-500 uppercase">Captured At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {(email_captures || []).map((c, i) => (
                  <tr key={i} className="hover:bg-zinc-800/30">
                    <td className="px-8 py-4 text-white font-medium">{c.email}</td>
                    <td className="px-8 py-4 text-zinc-500">{c.source}</td>
                    <td className="px-8 py-4 text-right text-zinc-400 font-mono">
                      {new Date(c.captured_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
                {(!email_captures || email_captures.length === 0) && (
                  <tr><td colSpan={3} className="px-8 py-10 text-center text-zinc-500">No emails captured yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}

function SummaryCard({ title, value, change }: { title: string, value: string | number, change: number }) {
  const isPositive = change >= 0
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl">
      <div className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-2">{title}</div>
      <div className="text-3xl font-bold text-white mb-2">{typeof value === 'number' ? value.toLocaleString() : value}</div>
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
