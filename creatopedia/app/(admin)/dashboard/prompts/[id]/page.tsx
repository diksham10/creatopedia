'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import PromptForm from '@/components/dashboard/PromptForm'
import { apiFetch } from '@/lib/api/client'
import type { Prompt } from '@/types'

interface Props {
  params: Promise<{ id: string }>
}

export default function EditPromptPage({ params }: Props) {
  const router = useRouter()
  const [prompt, setPrompt] = useState<Prompt | null>(null)

  useEffect(() => {
    params.then(({ id }) => {
      apiFetch<Prompt>(`/prompts/${id}`)
        .then(setPrompt)
        .catch(() => router.push('/dashboard/prompts'))
    })
  }, [params, router])

  if (!prompt) return null

  return (
    <div className="max-w-2xl animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight">Edit Prompt</h1>
        <p className="text-zinc-500 text-sm mt-1 truncate">/{prompt.slug}</p>
      </div>
      <PromptForm defaultValues={prompt} promptId={prompt.id} />
    </div>
  )
}
