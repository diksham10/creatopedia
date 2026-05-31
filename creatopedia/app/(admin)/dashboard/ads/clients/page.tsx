'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import AdClientsTable from '@/components/dashboard/ads/AdClientsTable'
import { apiFetch } from '@/lib/api/client'
import type { AdClient } from '@/types'

export default function AdClientsPage() {
  const [clients, setClients] = useState<AdClient[]>([])

  useEffect(() => {
    apiFetch<AdClient[]>('/ads/clients')
      .then((data) => setClients(data || []))
      .catch(() => setClients([]))
  }, [])

  const enriched = (clients ?? []).map((c) => ({
    ...c,
    active_campaigns: ((c as any).ad_campaigns ?? []).filter((cam: { status: string }) => cam.status === 'active').length,
    ad_campaigns: undefined,
  }))

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Ad Clients</h1>
          <p className="text-zinc-500 text-sm mt-1">
            {enriched.length} client{enriched.length !== 1 ? 's' : ''} · {enriched.filter(c => c.status === 'active').length} active
          </p>
        </div>
        <Link
          href="/dashboard/ads/clients/new"
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 py-3 text-sm font-bold text-white transition-all active:scale-95 shadow-lg shadow-indigo-500/20"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          New Client
        </Link>
      </div>

      <AdClientsTable clients={enriched} />
    </div>
  )
}
