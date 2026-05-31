'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  userId: string
  userEmail: string
}

export default function InitializeProfile({ userId, userEmail }: Props) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleInit() {
    setLoading(true)
    try {
      const res = await fetch('/api/creator/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, email: userEmail }),
      })
      if (res.ok) {
        router.refresh()
      } else {
        alert('Failed to initialize profile. Please ensure the backend is running and the "creators" table exists in your database.')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleInit}
      disabled={loading}
      className="px-8 py-4 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-500 transition-all active:scale-95 disabled:opacity-50 shadow-xl shadow-indigo-500/20"
    >
      {loading ? 'Initializing...' : '🚀 Create My Profile'}
    </button>
  )
}
