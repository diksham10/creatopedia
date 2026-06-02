import { unstable_cache } from 'next/cache'
import { apiFetchServer } from '@/lib/api/server'
import { Creator, Prompt } from '@/types'

export const getCachedCreator = (subdomain: string) => 
  unstable_cache(
    async (): Promise<Creator | null> => {
      try {
        // 🔴 CHANGED: Matches FastAPI endpoint /users/by-subdomain/{subdomain}
        const creator = await apiFetchServer<any>(`/users/by-subdomain/${subdomain}`)
        if (!creator) return null

        // 🔴 CHANGED: Backend returns creator directly, not wrapped in dbPortfolio.creator
        return {
          id: creator.id,
          email: '', 
          name: creator.name || '',
          handle: creator.handle || '',
          subdomain: subdomain, 
          avatar_url: creator.avatar_url,
          brand_color: creator.brand_color || '#6366f1', // Fallback color
          bio: creator.bio || '',
          instagram_url: null,
          tiktok_url: null,
          stripe_id: null,
          plan_tier: 'free',
          ad_frequency: 0,
          ads_enabled: false,
          created_at: new Date().toISOString()
        }
      } catch (err) {
        console.debug('getCachedCreator: portfolio fetch failed', { subdomain, err })
        return null
      }
    },
    ['creator', subdomain],
    { revalidate: 1, tags: [`creator-${subdomain}`] }
  )()

export const getCachedPrompt = (creatorSubdomain: string, slug: string) => 
  unstable_cache(
    async (): Promise<Prompt | null> => {
      try {
        // 🔴 CHANGED: Matches FastAPI endpoint
        const creator = await apiFetchServer<any>(`/users/by-subdomain/${creatorSubdomain}`)
        if (!creator || !creator.id) return null

        // Fetch prompts using the correct creator ID
        const promptsRes = await apiFetchServer<any>(`/prompts?creator_id=${creator.id}&status=published`)
        const prompts = Array.isArray(promptsRes) ? promptsRes : (promptsRes?.items || [])

        return prompts.find((p: any) => p.slug === slug) || null
      } catch (err) {
        console.debug('getCachedPrompt: fetch failed', { creatorSubdomain, slug, err })
        return null
      }
    },
    ['prompt', creatorSubdomain, slug],
    { revalidate: 1, tags: [`prompt-${creatorSubdomain}-${slug}`] }
  )()

export interface RelatedPromptType {
  id: string
  title: string
  slug: string
  ai_tool: string
  output_type: string
  thumbnail_url: string | null
}

export const getCachedRelatedPrompts = (creatorId: string, currentPromptId: string) => 
  unstable_cache(
    async (): Promise<RelatedPromptType[]> => {
      try {
        const promptsRes = await apiFetchServer<any>(
          `/prompts?creator_id=${creatorId}&status=published`
        )
        const data = Array.isArray(promptsRes) ? promptsRes : (promptsRes?.items || [])
        return (data || []).filter((p: any) => p.id !== currentPromptId).slice(0, 3)
      } catch (err) {
        console.debug('getCachedRelatedPrompts: fetch failed', { creatorId, currentPromptId, err })
        return []
      }
    },
    ['related-prompts', creatorId, currentPromptId],
    { revalidate: 60, tags: [`prompts-list-${creatorId}`] }
  )()