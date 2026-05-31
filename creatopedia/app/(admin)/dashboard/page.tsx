'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getAggregatedStats, AnalyticsStats } from '@/lib/analytics'

export default function AdminDashboard() {
  const [stats, setStats] = useState<AnalyticsStats | null>(null)

  useEffect(() => {
    getAggregatedStats().then(setStats).catch(() => setStats(null))
  }, [])

  if (!stats) return null

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20 max-w-7xl mx-auto">
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-white tracking-tight">Command Center</h1>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">System Online</span>
            </div>
          </div>
          <p className="text-zinc-500 text-sm">Central hub for managing your prompt empire.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard/settings" className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-sm font-semibold text-zinc-300 transition-colors">
            Settings
          </Link>
          <Link href="/dashboard/prompts/new" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition-all active:scale-95">
            + New Prompt
          </Link>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <QuickActionCard title="Manage Prompts" icon="📝" href="/dashboard/prompts" color="from-blue-500/10 to-indigo-500/10" textColor="text-indigo-400" />
        <QuickActionCard title="Categories" icon="🗂️" href="/dashboard/categories" color="from-purple-500/10 to-fuchsia-500/10" textColor="text-fuchsia-400" />
        <QuickActionCard title="Ad Campaigns" icon="🎯" href="/dashboard/ads" color="from-emerald-500/10 to-teal-500/10" textColor="text-emerald-400" />
        <QuickActionCard title="Deep Analytics" icon="📊" href="/dashboard/analytics" color="from-amber-500/10 to-orange-500/10" textColor="text-amber-400" />
      </div>

      {/* System Snapshot */}
      <div>
        <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-4 ml-1">System Snapshot</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SnapshotCard 
            label="Active Prompts" 
            value={`${stats.systemStats.activePrompts} / ${stats.systemStats.totalPrompts}`} 
            sub="Published vs Total" 
          />
          <SnapshotCard 
            label="Avg. Conversion" 
            value={`${stats.engagement.avgConversionRate.toFixed(1)}%`} 
            sub="Across all prompts" 
            highlight
          />
          <SnapshotCard 
            label="Unique Audience" 
            value={stats.engagement.totalUniqueVisitors.toLocaleString()} 
            sub="Last 30 days" 
          />
          <SnapshotCard 
            label="Active Ads" 
            value={stats.systemStats.activeCampaigns} 
            sub="Running campaigns" 
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left: Trending & Insights */}
        <div className="lg:col-span-2 space-y-8">
          
          <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800/80 rounded-3xl p-6 shadow-xl relative overflow-hidden">
             {/* decorative background element */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
            
            <div className="flex items-center justify-between mb-6 relative z-10">
              <h3 className="text-white font-bold text-lg flex items-center gap-2">
                <span className="text-xl">🔥</span> Trending Prompts
              </h3>
            </div>
            
            <div className="space-y-3 relative z-10">
              {stats.trendingPrompts.length > 0 ? stats.trendingPrompts.map((p, i) => (
                <div key={p.id} className="flex items-center justify-between p-4 bg-zinc-900/80 border border-zinc-800/50 rounded-2xl hover:border-indigo-500/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center font-bold text-zinc-500">
                      #{i + 1}
                    </div>
                    <div>
                      <h4 className="text-white font-semibold text-sm">{p.title}</h4>
                      <p className="text-xs text-zinc-500">/{p.slug}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-emerald-400 font-bold text-sm flex items-center gap-1 justify-end">
                      ↗ {p.growth}%
                    </div>
                    <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold mt-1">Growth (24h)</div>
                  </div>
                </div>
              )) : (
                <div className="p-8 text-center border border-dashed border-zinc-800 rounded-2xl">
                  <p className="text-zinc-500 text-sm">Not enough data to determine trends.</p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Traffic Overview Mini */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
              <h3 className="text-white font-bold text-sm mb-4">Top Traffic Sources</h3>
              <div className="space-y-4">
                {stats.trafficSources.map(s => (
                  <div key={s.source}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-zinc-400 truncate max-w-[120px]">{s.source}</span>
                      <span className="text-white font-mono">{s.count}</span>
                    </div>
                    <div className="w-full bg-zinc-800 rounded-full h-1.5">
                      <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, (s.count / Math.max(...stats.trafficSources.map(x=>x.count)) * 100))}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Quick Tips / System Messages */}
            <div className="bg-indigo-950/20 border border-indigo-500/20 rounded-3xl p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-indigo-400 font-bold text-sm mb-2 flex items-center gap-2">
                  <span className="text-lg">💡</span> Pro Tip
                </h3>
                <p className="text-zinc-300 text-sm leading-relaxed">
                  Prompts with high views but low conversion rates usually need a more compelling description. Try adding more examples!
                </p>
              </div>
              <Link href="/dashboard/prompts" className="text-xs font-bold text-indigo-400 hover:text-indigo-300 mt-4 inline-block">
                Review Prompts →
              </Link>
            </div>
          </div>

        </div>

        {/* Right: Activity Feed */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 flex flex-col h-full">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-white font-bold text-lg flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping absolute" />
              <span className="w-2 h-2 rounded-full bg-blue-500 relative" />
              Live Activity
            </h3>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
            {stats.recentCaptures.length > 0 ? (
              stats.recentCaptures.map((capture, idx) => (
                <div key={capture.id} className="relative pl-6 pb-4 border-l border-zinc-800 last:border-0 last:pb-0">
                  <div className="absolute left-[-5px] top-1 w-2.5 h-2.5 rounded-full bg-zinc-700 border-2 border-zinc-900" />
                  <div className="bg-zinc-950/50 border border-zinc-800/50 rounded-xl p-3">
                    <p className="text-xs text-zinc-400 mb-1">
                      <span className="text-emerald-400 font-bold">New Lead</span> via {capture.prompts?.title || 'Unknown'}
                    </p>
                    <p className="text-sm font-semibold text-white truncate">{capture.email}</p>
                    <p className="text-[10px] text-zinc-600 mt-2 font-mono">
                      {new Date(capture.captured_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10">
                <p className="text-zinc-600 text-sm italic">Waiting for activity...</p>
              </div>
            )}
          </div>
          
          <Link href="/dashboard/analytics" className="mt-6 block text-center text-xs font-bold text-zinc-500 hover:text-white bg-zinc-950 py-3 rounded-xl border border-zinc-800 transition-colors">
            View Full Logs
          </Link>
        </div>

      </div>
    </div>
  )
}

function QuickActionCard({ title, icon, href, color, textColor }: { title: string, icon: string, href: string, color: string, textColor: string }) {
  return (
    <Link href={href} className={`bg-gradient-to-br ${color} border border-zinc-800/50 rounded-2xl p-5 hover:scale-[1.02] transition-transform active:scale-95`}>
      <div className="text-2xl mb-3">{icon}</div>
      <div className={`text-sm font-bold ${textColor}`}>{title}</div>
    </Link>
  )
}

function SnapshotCard({ label, value, sub, highlight = false }: { label: string, value: string | number, sub: string, highlight?: boolean }) {
  return (
    <div className={`bg-zinc-900 border ${highlight ? 'border-indigo-500/30' : 'border-zinc-800'} rounded-2xl p-5 flex flex-col justify-center`}>
      <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-3xl font-black ${highlight ? 'text-indigo-400' : 'text-white'} mb-1`}>{value}</p>
      <p className="text-[10px] text-zinc-600 font-medium">{sub}</p>
    </div>
  )
}
