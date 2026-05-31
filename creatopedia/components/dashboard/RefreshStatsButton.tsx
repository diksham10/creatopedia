'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'

export default function RefreshStatsButton() {
  const [isSyncing, setIsSyncing] = useState(false)
  const router = useRouter()
  const queryClient = useQueryClient()

  async function handleSync() {
    if (isSyncing) return
    setIsSyncing(true)
    try {
      const res = await fetch('/api/analytics/sync', { method: 'POST' })
      if (res.ok) {
        // Invalidate all analytics related queries
        await queryClient.invalidateQueries({ queryKey: ['analytics'] })
        router.refresh()
      }
    } catch (err) {
      console.error('Failed to sync stats:', err)
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <button
      onClick={handleSync}
      disabled={isSyncing}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800 transition-all disabled:opacity-50 active:scale-95 shadow-sm border border-zinc-800"
    >
      <svg 
        className={`w-4 h-4 ${isSyncing ? 'animate-spin text-indigo-400' : 'text-zinc-400'}`} 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
        />
      </svg>
      {isSyncing ? 'Syncing...' : 'Sync Latest Data'}
    </button>
  )
}
