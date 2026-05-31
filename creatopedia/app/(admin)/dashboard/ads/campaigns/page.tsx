'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import AdCampaignsTable from '@/components/dashboard/ads/AdCampaignsTable'
import type { AdCampaign } from '@/types'
import type { AdClient, Prompt, Category } from '@/types'
import { apiFetch } from '@/lib/api/client'

export default function AdCampaignsPage() {
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([])
  const [clients, setClients] = useState<AdClient[]>([])
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    async function load() {
      const profile = await apiFetch<{ id: string }>('/users/me/profile')
      const [campaignData, clientData, promptData, categoryData] = await Promise.all([
        apiFetch<AdCampaign[]>('/ads/campaigns'),
        apiFetch<AdClient[]>('/ads/clients'),
        apiFetch<any>(`/prompts?creator_id=${profile.id}&status=published`),
        apiFetch<Category[]>('/categories'),
      ])
      setCampaigns((campaignData || []).map((c) => ({
        ...c,
        impressions_count: c.impressions_count ?? 0,
        clicks_count: c.clicks_count ?? 0,
      })))
      setClients(clientData || [])
      setPrompts(Array.isArray(promptData) ? promptData : (promptData?.items || []))
      setCategories(categoryData || [])
    }

    load().catch(() => null)
  }, [])

  const enriched = campaigns

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Ad Campaigns</h1>
          <p className="text-zinc-500 text-sm mt-1">Manage and track your advertising placements.</p>
        </div>
      </div>

      <AdCampaignsTable 
        campaigns={enriched as AdCampaign[]} 
        clients={clients ?? []} 
        prompts={prompts ?? []}
        categories={categories ?? []}
      />
    </div>
  )
}
