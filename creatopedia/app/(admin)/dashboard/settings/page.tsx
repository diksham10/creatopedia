'use client'

import { useEffect, useState } from 'react'
import ControlCenter from '@/components/dashboard/ControlCenter'
import { apiFetch } from '@/lib/api/client'
import type { Creator, Category, AdCampaign, AdClient, Prompt } from '@/types'

export default function SettingsPage() {
  const [creator, setCreator] = useState<Creator | null>(null)
  const [igUser, setIgUser] = useState<any | null>(null)
  const [igFeed, setIgFeed] = useState<any[]>([])
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([])
  const [clients, setClients] = useState<AdClient[]>([])
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    async function load() {
      const profile = await apiFetch<Creator>('/users/me/profile')
      setCreator(profile)

      const [igUserData, igFeedData] = await Promise.all([
        apiFetch(`/public/instagram/${profile.id}/user`),
        apiFetch(`/public/instagram/${profile.id}/feed?limit=100`),
      ])
      setIgUser(igUserData)
      setIgFeed(igFeedData as any[])

      const [campaignData, clientData, promptData, categoryData] = await Promise.all([
        apiFetch<AdCampaign[]>('/ads/campaigns'),
        apiFetch<AdClient[]>('/ads/clients'),
        apiFetch<Prompt[]>(`/prompts?creator_id=${profile.id}&status=published`),
        apiFetch<Category[]>('/categories'),
      ])

      setCampaigns(campaignData || [])
      setClients(clientData || [])
      setPrompts(promptData || [])
      setCategories(categoryData || [])
    }

    load().catch(() => null)
  }, [])

  if (!creator) return null

  return (
    <div className="space-y-10 max-w-5xl">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold text-white tracking-tight">Platform Controls</h1>
        <p className="text-zinc-500 text-sm">Configure your hub, manage integrations, and organize categories.</p>
      </div>

      <ControlCenter
        creator={creator!}
        userEmail={creator.email}
        igUser={igUser}
        igFeed={igFeed}
        campaigns={campaigns || []}
        clients={clients || []}
        prompts={prompts || []}
        categories={categories || []}
      />
    </div>
  )
}
