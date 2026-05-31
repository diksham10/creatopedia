'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import EnhancedPublicPromptUI from '@/components/public/EnhancedPublicPromptUI'
import { apiFetch } from '@/lib/api/client'
import type { Prompt, Creator } from '@/types'

interface Params {
  params: Promise<{ id: string }>
}

export default function AdminPromptViewPage({ params }: Params) {
  const router = useRouter()
  const [creator, setCreator] = useState<Creator | null>(null)
  const [prompt, setPrompt] = useState<Prompt | null>(null)
  const [related, setRelated] = useState<
    { id: string; title: string; slug: string; ai_tool: string; output_type: string; thumbnail_url: string | null }[]
  >([])
  const [oEmbedHtml, setOEmbedHtml] = useState<string | null>(null)
  const [igUser, setIgUser] = useState<any | null>(null)
  const [igFeed, setIgFeed] = useState<any[]>([])
  const [igMedia, setIgMedia] = useState<any | null>(null)

  useEffect(() => {
    params.then(async ({ id }) => {
      try {
        const profile = await apiFetch<Creator>('/users/me/profile')
        setCreator(profile)

        const promptData = await apiFetch<Prompt>(`/prompts/${id}`)
        setPrompt(promptData)

        const [promptsRes, igUserData, igFeedData] = await Promise.all([
          apiFetch<any>(`/prompts?creator_id=${profile.id}&status=published`),
          apiFetch(`/public/instagram/${profile.id}/user`),
          apiFetch(`/public/instagram/${profile.id}/feed?limit=100`),
        ])

        const relatedData = Array.isArray(promptsRes) ? promptsRes : (promptsRes?.items || [])

        setRelated((relatedData || []).filter((p: any) => p.id !== promptData.id).slice(0, 3))
        setIgUser(igUserData)
        setIgFeed(igFeedData as any[])

        if (promptData.video_url) {
          const res = await fetch(`/api/instagram/oembed?url=${encodeURIComponent(promptData.video_url)}`)
          const data = await res.json()
          setOEmbedHtml(data?.html ?? null)

          const media = await apiFetch(
            `/public/instagram/${profile.id}/media?url=${encodeURIComponent(promptData.video_url)}`
          )
          setIgMedia(media)
        }
      } catch (err) {
        console.error(err)
        router.push('/login')
      }
    })
  }, [params, router])

  if (!creator || !prompt) return null

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Admin Control Bar */}
      <div className="sticky top-0 z-50 bg-zinc-900/80 backdrop-blur-md border-b border-zinc-800 px-6 py-4 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-4">
          <Link 
            href="/dashboard/prompts" 
            className="text-zinc-500 hover:text-white transition-colors text-sm font-semibold flex items-center gap-2"
          >
            ← Back
          </Link>
          <div className="h-4 w-px bg-zinc-800" />
          <h1 className="text-sm font-bold text-white truncate max-w-[200px]">
            Previewing: {prompt.title}
          </h1>
          {prompt.status === 'draft' && (
            <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-500 text-[10px] font-bold uppercase tracking-wider border border-zinc-700">
              Draft Mode
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          <Link
            href={`/dashboard/analytics/prompts/${prompt.id}`}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition-all flex items-center gap-2"
          >
            📈 View Analytics
          </Link>
          <Link
            href={`/dashboard/prompts/${prompt.id}`}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all"
          >
            Edit Prompt
          </Link>
        </div>
      </div>

      {/* Actual Iframe Section (Preview) */}
      <div className="p-4 md:p-8">
        <div className="max-w-screen-xl mx-auto border border-zinc-800 rounded-[40px] overflow-hidden bg-zinc-900 shadow-2xl relative">
          {/* Label for "What it looks like on landing page" */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 px-3 py-1 bg-black/50 backdrop-blur-md border border-white/10 rounded-full text-[10px] text-white/50 font-bold uppercase tracking-[0.2em]">
            Public Page Preview
          </div>

          <div className="opacity-90">
             {/* We remove pointer-events-none so admin can test the copy/unlock flow */}
            <EnhancedPublicPromptUI
              creator={creator}
              prompt={prompt}
              igUser={igUser}
              igMedia={igMedia}
              igFeed={igFeed}
              relatedData={related ?? []}
              oEmbedHtml={oEmbedHtml}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
