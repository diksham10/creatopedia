'use client'

import { useEffect, useState } from 'react'
import PromptTable from '@/components/dashboard/PromptTable'
import PromptsHeader from '@/components/dashboard/PromptsHeader'
import { apiFetch } from '@/lib/api/client'
import type { Prompt, Category } from '@/types'

export default function AdminPromptsPage() {
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [subdomain, setSubdomain] = useState('')

  useEffect(() => {
    async function load() {
      const profile = await apiFetch<{ id: string; subdomain: string }>(
        '/users/me/profile'
      )
      setSubdomain(profile.subdomain)

      const [promptData, categories] = await Promise.all([
        apiFetch<any>(`/prompts?creator_id=${profile.id}`),
        apiFetch<Category[]>('/categories'),
      ])

      const categoryMap = new Map(categories.map((c) => [c.id, c.name]))
      // Support both PaginatedResponse shape { items: [...] } and raw array fallback
      const items = Array.isArray(promptData) ? promptData : (promptData?.items || [])
      const enriched = items.map((p: any) => ({
        ...p,
        categories: { name: categoryMap.get(p.category_id) || 'Uncategorized' },
      }))

      setPrompts(enriched as Prompt[])
    }

    load().catch(() => setPrompts([]))
  }, [])

  const published = prompts?.filter(p => p.status === 'published').length ?? 0
  const drafts = prompts?.filter(p => p.status === 'draft').length ?? 0

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PromptsHeader published={published} drafts={drafts} />

      {/* Table */}
      <PromptTable prompts={prompts ?? []} subdomain={subdomain} />
    </div>
  )
}
