import { unstable_cache } from 'next/cache'
import { apiFetchServer } from '@/lib/api/server'
import { Creator, Prompt } from '@/types'

export const getCachedCreator = (subdomain: string) => 
  unstable_cache(
    async (): Promise<Creator | null> => {
      const dbPortfolio = await apiFetchServer<any>(`/users/${subdomain}`)
      if (!dbPortfolio || !dbPortfolio.creator) return null

      // Map backend PortfolioPublicOut to frontend Creator type
      return {
        id: dbPortfolio.creator.id,
        email: '', // Not strictly needed publicly usually
        name: dbPortfolio.creator.name || '',
        handle: dbPortfolio.creator.handle || '',
        subdomain: subdomain, // Assuming it's mapped 1-1
        avatar_url: dbPortfolio.creator.avatar_url,
        brand_color: dbPortfolio.theme_color || '#000000',
        bio: dbPortfolio.creator.bio || '',
        instagram_url: null,
        tiktok_url: null,
        stripe_id: null,
        plan_tier: 'free',
        ad_frequency: 0,
        ads_enabled: false,
        created_at: new Date().toISOString()
      }
    },
    ['creator', subdomain],
    { revalidate: 1, tags: [`creator-${subdomain}`] }
  )()

export const getCachedPrompt = (creatorSubdomain: string, slug: string) => 
  unstable_cache(
    async (): Promise<Prompt | null> => {
      // You may need to create a dedicated backend endpoint for fetching by subdomain + slug
      // For now, let's fetch all published prompts for the subdomain user and find the match
      const dbPortfolio = await apiFetchServer<{ creator: { id: string } } | null>(`/users/${creatorSubdomain}`)
      if (!dbPortfolio || !dbPortfolio.creator) return null
      
      const promptsRes = await apiFetchServer<any>(`/prompts?creator_id=${dbPortfolio.creator.id}&status=published`)
      const prompts = Array.isArray(promptsRes) ? promptsRes : (promptsRes?.items || [])
      
      return prompts.find((p: any) => p.slug === slug) || null
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
      const promptsRes = await apiFetchServer<any>(
        `/prompts?creator_id=${creatorId}&status=published`
      )
      const data = Array.isArray(promptsRes) ? promptsRes : (promptsRes?.items || [])
      return (data || []).filter((p: any) => p.id !== currentPromptId).slice(0, 3)
    },
    ['related-prompts', creatorId, currentPromptId],
    { revalidate: 60, tags: [`prompts-list-${creatorId}`] }
  )()
