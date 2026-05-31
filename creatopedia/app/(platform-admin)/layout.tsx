'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api/client'
import Link from 'next/link'

export default function PlatformAdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [admin, setAdmin] = useState<{ name: string; role: string } | null>(null)

  useEffect(() => {
    let isMounted = true
    apiFetch<{ name: string; role: string }>('/users/me/profile')
      .then((data) => {
        if (!isMounted) return
        if (data.role !== 'admin') {
          router.push('/dashboard')
        } else {
          setAdmin(data)
        }
      })
      .catch(() => {
        router.push('/login')
      })

    return () => {
      isMounted = false
    }
  }, [router])

  if (!admin) {
    return null
  }

  return (
    <div className="flex h-screen bg-zinc-950 text-white overflow-hidden">
      <aside className="w-64 flex flex-col bg-zinc-900 border-r border-zinc-800 hidden md:flex">
        <div className="p-6 border-b border-zinc-800">
          <Link href="/admin" className="text-xl font-bold font-serif tracking-tight text-white flex items-center gap-2">
            Creatopedia <span className="text-[10px] uppercase font-mono tracking-widest text-pink-500 border border-pink-500/30 px-1.5 py-0.5 rounded">Admin</span>
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <Link href="/admin" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg bg-zinc-800 text-white">
            Platform Overview
          </Link>
          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-colors mt-8">
            ← Back to Portal
          </Link>
        </nav>
        <div className="p-4 border-t border-zinc-800 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{admin.name}</p>
            <p className="text-xs text-zinc-500 truncate capitalize">{admin.role}</p>
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-8 lg:p-12">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
