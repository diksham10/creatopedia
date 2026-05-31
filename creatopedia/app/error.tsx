'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 text-zinc-50 px-6 text-center">
      <div className="w-24 h-24 bg-red-500/10 rounded-3xl flex items-center justify-center mb-8 border border-red-500/20">
        <span className="text-4xl text-red-500">⚠️</span>
      </div>
      <h2 className="text-2xl font-bold text-white tracking-tight">Something went wrong</h2>
      <p className="text-zinc-500 mt-2 max-w-xs leading-relaxed">
        {error.message || "An unexpected error occurred while processing your request."}
      </p>
      <button
        onClick={() => reset()}
        className="mt-8 px-8 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-500 transition-all active:scale-95 shadow-xl shadow-indigo-500/20"
      >
        Try again
      </button>
    </div>
  )
}
