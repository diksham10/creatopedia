'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import PromptModal from './PromptModal'

interface Props {
  published: number
  drafts: number
}

export default function PromptsHeader({ published, drafts }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsOpen(true)
      // Clean up the URL without a full navigation
      const newParams = new URLSearchParams(searchParams.toString())
      newParams.delete('new')
      const queryString = newParams.toString()
      router.replace(window.location.pathname + (queryString ? `?${queryString}` : ''))
    }
  }, [searchParams, router])

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Prompts</h1>
          <p className="text-zinc-500 text-sm mt-1">
            {published} published &middot; {drafts} draft
          </p>
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 py-3 text-sm font-bold text-white transition-all active:scale-95 shadow-lg shadow-indigo-500/20"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          New Prompt
        </button>
      </div>

      <PromptModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}
