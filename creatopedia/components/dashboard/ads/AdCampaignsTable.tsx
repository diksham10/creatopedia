'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { AdCampaign } from '@/types'
import AdCampaignForm from './AdCampaignForm'
import { X, Plus, Edit2, BarChart2, Copy, Pause, Play, Trash2 } from 'lucide-react'
import Link from 'next/link'

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  paused: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  ended: 'bg-zinc-700/50 text-zinc-500 border-zinc-600/30',
  scheduled: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
}

const STATUS_TABS = ['all', 'active', 'paused', 'ended', 'scheduled'] as const
type StatusTab = typeof STATUS_TABS[number]

function getCtrColor(ctr: number) {
  if (ctr > 5) return 'text-emerald-400'
  if (ctr >= 2) return 'text-amber-400'
  return 'text-red-400'
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })
}

interface Props {
  campaigns: AdCampaign[]
  clients: { id: string; name: string }[]
  prompts: { id: string; title: string; slug: string }[]
  categories: { id: string; name: string }[]
}

export default function AdCampaignsTable({ campaigns: initial, clients, prompts, categories }: Props) {
  const router = useRouter()
  const [campaigns, setCampaigns] = useState(initial)
  const [, startTransition] = useTransition()

  useEffect(() => {
    setCampaigns(initial)
  }, [initial])
  const [activeTab, setActiveTab] = useState<StatusTab>('all')
  const [clientFilter, setClientFilter] = useState<string>('all')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState<AdCampaign | null>(null)

  const filtered = campaigns.filter(c => {
    if (activeTab !== 'all' && c.status !== activeTab) return false
    if (clientFilter !== 'all' && c.client_id !== clientFilter) return false
    return true
  })

  async function handleTogglePause(c: AdCampaign) {
    setTogglingId(c.id)
    const newStatus = c.status === 'active' ? 'paused' : 'active'
    const res = await fetch(`/api/ads/campaigns/${c.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: newStatus }),
    })
    if (res.ok) {
      setCampaigns(prev => prev.map(x => x.id === c.id ? { ...x, status: newStatus } : x))
      startTransition(() => router.refresh())
    }
    setTogglingId(null)
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete campaign "${name}"? This cannot be undone.`)) return
    setDeletingId(id)
    const res = await fetch(`/api/ads/campaigns/${id}`, {
      method: 'DELETE',
    })
    if (res.ok) {
      setCampaigns(prev => prev.filter(c => c.id !== id))
    }
    setDeletingId(null)
  }

  function copyReportLink(token: string) {
    const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN ?? 'creatopedia.tech'
    navigator.clipboard.writeText(`https://${baseDomain}/ads/report/${token}`)
  }

  if (campaigns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-zinc-800 rounded-3xl">
        <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center text-3xl mb-4">📣</div>
        <p className="text-white font-bold text-lg mb-2">No campaigns yet</p>
        <p className="text-zinc-500 text-sm mb-6">Create your first ad campaign to start monetizing your pages.</p>
        <button
          onClick={() => { setEditingCampaign(null); setIsModalOpen(true); }}
          className="rounded-full bg-indigo-600 hover:bg-indigo-500 px-6 py-3 text-sm font-bold text-white transition-all"
        >
          + New Campaign
        </button>

        {isModalOpen && renderModal()}
      </div>
    )
  }

  function renderModal() {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="relative w-full max-w-4xl bg-zinc-950 rounded-[32px] shadow-2xl border border-zinc-800 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
          <div className="px-8 py-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                {editingCampaign ? 'Edit Campaign' : 'Create New Campaign'}
              </h2>
              <p className="text-zinc-500 text-xs mt-0.5">
                {editingCampaign ? 'Update campaign details and placements.' : 'Set up a new advertising campaign.'}
              </p>
            </div>
            <button
              onClick={() => setIsModalOpen(false)}
              className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            <AdCampaignForm
              campaignId={editingCampaign?.id}
              defaultValues={editingCampaign ?? undefined}
              clients={clients}
              prompts={prompts}
              categories={categories}
              onSuccess={() => {
                setIsModalOpen(false)
                startTransition(() => {
                  router.refresh()
                  // In a real app we might refetch or the server action would handle this
                  // For now, let's just close and refresh.
                  window.location.reload()
                })
              }}
              onCancel={() => setIsModalOpen(false)}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        {/* Tab pills */}
        <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1 flex-wrap">
          {STATUS_TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${activeTab === tab
                  ? 'bg-indigo-600 text-white'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Client filter */}
        {clients.length > 0 && (
          <select
            value={clientFilter}
            onChange={e => setClientFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          >
            <option value="all">All clients</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        )}

        <p className="text-xs text-zinc-500 sm:ml-auto">{filtered.length} campaign{filtered.length !== 1 ? 's' : ''}</p>

        <button
          onClick={() => { setEditingCampaign(null); setIsModalOpen(true); }}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-bold text-white transition-all active:scale-95 shadow-lg shadow-indigo-500/20"
        >
          <Plus className="w-3.5 h-3.5" />
          New Campaign
        </button>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-zinc-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/50">
              <th className="text-left px-5 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Campaign</th>
              <th className="text-left px-4 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider hidden md:table-cell">Client</th>
              <th className="text-left px-4 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Status</th>
              <th className="text-right px-4 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider hidden lg:table-cell">Impr.</th>
              <th className="text-right px-4 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider hidden lg:table-cell">Clicks</th>
              <th className="text-right px-4 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider hidden lg:table-cell">CTR</th>
              <th className="text-left px-4 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider hidden xl:table-cell">Dates</th>
              <th className="px-4 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {filtered.map((c) => {
              const imps = c.impressions_count ?? 0
              const clks = c.clicks_count ?? 0
              const ctr = imps > 0 ? (clks / imps) * 100 : 0

              return (
                <tr key={c.id} className={`hover:bg-zinc-900/40 transition-colors ${deletingId === c.id ? 'opacity-40' : ''}`}>
                  <td className="px-5 py-4">
                    <p className="font-semibold text-white truncate max-w-[180px]">{c.name}</p>
                  </td>
                  <td className="px-4 py-4 hidden md:table-cell">
                    <span className="text-xs text-zinc-400">{c.client?.name ?? '—'}</span>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${STATUS_STYLES[c.status]}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right hidden lg:table-cell">
                    <span className="text-xs font-mono text-zinc-300">{imps.toLocaleString()}</span>
                  </td>
                  <td className="px-4 py-4 text-right hidden lg:table-cell">
                    <span className="text-xs font-mono text-zinc-300">{clks.toLocaleString()}</span>
                  </td>
                  <td className="px-4 py-4 text-right hidden lg:table-cell">
                    <span className={`text-xs font-bold font-mono ${getCtrColor(ctr)}`}>
                      {ctr.toFixed(2)}%
                    </span>
                  </td>
                  <td className="px-4 py-4 hidden xl:table-cell">
                    <span className="text-xs text-zinc-500">
                      {formatDate(c.starts_at)} — {formatDate(c.ends_at)}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => { setEditingCampaign(c); setIsModalOpen(true); }}
                        className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all"
                        title="Edit Campaign"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <Link
                        href={`/ads/report/${c.report_token}`}
                        target="_blank"
                        className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all"
                        title="View Report"
                      >
                        <BarChart2 className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => copyReportLink(c.report_token)}
                        title="Copy report link"
                        className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleTogglePause(c)}
                        disabled={togglingId === c.id || (c.status !== 'active' && c.status !== 'paused')}
                        className={`p-2 rounded-lg transition-all disabled:opacity-50 ${c.status === 'active'
                            ? 'text-amber-400 hover:bg-amber-600/10'
                            : 'text-emerald-400 hover:bg-emerald-600/10'
                          }`}
                        title={c.status === 'active' ? 'Pause' : 'Resume'}
                      >
                        {togglingId === c.id ? <div className="w-4 h-4 border-2 border-current border-t-transparent animate-spin rounded-full" /> : c.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleDelete(c.id, c.name)}
                        disabled={deletingId === c.id}
                        className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition-all disabled:opacity-50"
                        title="Delete Campaign"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="px-8 py-12 text-center text-zinc-500 text-sm">
            No campaigns match this filter.
          </div>
        )}
      </div>

      {isModalOpen && renderModal()}
    </div>
  )
}
