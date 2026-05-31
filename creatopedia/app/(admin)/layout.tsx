'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/dashboard/Sidebar'
import { apiFetch } from '@/lib/api/client'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [creator, setCreator] = useState<{ name: string; handle: string; avatar_url: string | null } | null>(null)

  useEffect(() => {
    let isMounted = true
    apiFetch<{ name: string; handle: string; avatar_url: string | null }>('/users/me/profile')
      .then((data) => {
        if (isMounted) setCreator(data)
      })
      .catch(() => {
        router.push('/login')
      })

    return () => {
      isMounted = false
    }
  }, [router])

  if (!creator) {
    return null
  }

  return (
    <div className="flex h-screen bg-zinc-950 overflow-hidden">
      <Sidebar creator={creator || { name: 'Creator', handle: 'handle', avatar_url: null }} />
      <main className="flex-1 overflow-y-auto p-8 lg:p-12">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
