'use client'

import { useEffect, useState } from 'react'
import AdCampaignForm from '@/components/dashboard/ads/AdCampaignForm'
import { apiFetch } from '@/lib/api/client'
import type { AdClient, Prompt, Category } from '@/types'

interface Params { searchParams: Promise<{ client_id?: string }> }

export default function NewAdCampaignPage({ searchParams }: Params) {
  const [clients, setClients] = useState<AdClient[]>([])
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [initialClientId, setInitialClientId] = useState<string | undefined>()

  useEffect(() => {
    searchParams.then(({ client_id }) => setInitialClientId(client_id))
  }, [searchParams])

  useEffect(() => {
    async function load() {
      const profile = await apiFetch<{ id: string }>('/users/me/profile')
      const [clientData, promptData, categoryData] = await Promise.all([
        apiFetch<AdClient[]>('/ads/clients'),
        apiFetch<Prompt[]>(`/prompts?creator_id=${profile.id}&status=published`),
        apiFetch<Category[]>('/categories'),
      ])
      setClients(clientData || [])
      setPrompts(promptData || [])
      setCategories(categoryData || [])
    }

    load().catch(() => null)
  }, [])

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">New Ad Campaign</h1>
        <p className="text-zinc-500 text-sm mt-1">Configure your ad creative and display rules.</p>
      </div>
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
        <AdCampaignForm 
          clients={clients ?? []} 
          prompts={prompts ?? []} 
          categories={categories ?? []}
          initialClientId={initialClientId} 
        />
      </div>
    </div>
  )
}
