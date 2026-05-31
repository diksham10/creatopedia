'use client'

import { useState, useTransition, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { AdClient } from '@/types'

interface AdClientWithCount extends AdClient {
  active_campaigns: number
}

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  inactive: 'bg-zinc-700/50 text-zinc-500 border-zinc-600/30',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

interface Props {
  clients: AdClientWithCount[]
}

export default function AdClientsTable({ clients: initial }: Props) {
  const router = useRouter()
  const [clients, setClients] = useState(initial)
  const [, startTransition] = useTransition()

  useEffect(() => {
    setClients(initial)
  }, [initial])
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  async function handleToggleStatus(c: AdClientWithCount) {
    setTogglingId(c.id)
    const newStatus = c.status === 'active' ? 'inactive' : 'active'
    const res = await fetch(`/api/ads/clients/${c.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: newStatus }),
    })
    if (res.ok) {
      setClients(prev => prev.map(x => x.id === c.id ? { ...x, status: newStatus } : x))
      startTransition(() => router.refresh())
    }
    setTogglingId(null)
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? All associated campaigns will be unlinked.`)) return
    setDeletingId(id)
    const res = await fetch(`/api/ads/clients/${id}`, {
      method: 'DELETE',
    })
    if (res.ok) {
      setClients(prev => prev.filter(c => c.id !== id))
    }
    setDeletingId(null)
  }

  if (clients.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-zinc-800 rounded-3xl">
        <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center text-3xl mb-4">📢</div>
        <p className="text-white font-bold text-lg mb-2">No ad clients yet</p>
        <p className="text-zinc-500 text-sm mb-6">Add your first advertiser to start running campaigns.</p>
        <Link href="/dashboard/ads/clients/new" className="rounded-full bg-indigo-600 hover:bg-indigo-500 px-6 py-3 text-sm font-bold text-white transition-all">
          + Add Client
        </Link>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-zinc-800 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-800 bg-zinc-900/50">
            <th className="text-left px-5 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Client Name</th>
            <th className="text-left px-4 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider hidden md:table-cell">Company</th>
            <th className="text-left px-4 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider hidden lg:table-cell">Email</th>
            <th className="text-left px-4 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Campaigns</th>
            <th className="text-left px-4 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Status</th>
            <th className="text-left px-4 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider hidden xl:table-cell">Since</th>
            <th className="px-4 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800">
          {clients.map((c) => (
            <tr key={c.id} className={`hover:bg-zinc-900/40 transition-colors ${deletingId === c.id ? 'opacity-40' : ''}`}>
              <td className="px-5 py-4">
                <p className="font-semibold text-white truncate max-w-[180px]">{c.name}</p>
                {c.website && <p className="text-xs text-zinc-500 mt-0.5 truncate max-w-[180px]">{c.website}</p>}
              </td>
              <td className="px-4 py-4 hidden md:table-cell">
                <span className="text-xs text-zinc-400">{c.company || '—'}</span>
              </td>
              <td className="px-4 py-4 hidden lg:table-cell">
                <span className="text-xs text-zinc-400">{c.email || '—'}</span>
              </td>
              <td className="px-4 py-4">
                <span className="text-xs font-bold text-indigo-400">{c.active_campaigns} active</span>
              </td>
              <td className="px-4 py-4">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${STATUS_STYLES[c.status]}`}>
                  {c.status}
                </span>
              </td>
              <td className="px-4 py-4 hidden xl:table-cell">
                <span className="text-xs text-zinc-500">{formatDate(c.created_at)}</span>
              </td>
              <td className="px-4 py-4">
                <div className="flex items-center justify-end gap-2">
                  <Link
                    href={`/dashboard/ads/clients/${c.id}`}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 border border-transparent hover:border-zinc-700 transition-all"
                  >
                    Edit
                  </Link>
                  <Link
                    href={`/dashboard/ads/campaigns?client_id=${c.id}`}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 border border-transparent hover:border-zinc-700 transition-all"
                  >
                    Campaigns
                  </Link>
                  <button
                    onClick={() => handleToggleStatus(c)}
                    disabled={togglingId === c.id}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all disabled:opacity-50 ${
                      c.status === 'active'
                        ? 'text-zinc-400 hover:text-white border-transparent hover:border-zinc-700 hover:bg-zinc-800'
                        : 'text-emerald-400 border-emerald-500/30 hover:bg-emerald-600/10'
                    }`}
                  >
                    {togglingId === c.id ? '…' : c.status === 'active' ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => handleDelete(c.id, c.name)}
                    disabled={deletingId === c.id}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-red-500 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
