import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { apiFetchServer } from '@/lib/api/server'
import { fetchInstagramOEmbed } from '@/lib/oembed'
import ViewTracker from '@/components/public/ViewTracker'
import AdBanner from '@/components/public/AdBanner'
import { fetchInstagramMedia, fetchInstagramUser, fetchInstagramFeed } from '@/lib/instagram'
import { AdPlacementPosition } from '@/types'
import { AdPlacementData } from '@/components/public/AdBanner'
import EnhancedPublicPromptUI from '@/components/public/EnhancedPublicPromptUI'
import { getCachedCreator, getCachedPrompt, getCachedRelatedPrompts } from '@/lib/data/public-prompts'

export const revalidate = 60 // 60 seconds (matches the profile page)

interface Params {
  params: Promise<{ subdomain: string; slug: string }>
}

interface AdPlacement extends Omit<AdPlacementData, 'position'> {
  position: AdPlacementPosition
  category_id?: string | null
  campaign: AdPlacementData['campaign'] & {
    starts_at?: string | null
    ends_at?: string | null
  }
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { subdomain, slug } = await params
  const dbPortfolio = await apiFetchServer<{
    creator: { id: string; name: string; handle: string }
    theme_color?: string
  } | null>(`/users/${subdomain}`)
  if (!dbPortfolio || !dbPortfolio.creator) return { title: 'Not Found' }

  // Temporarily grab prompts for slug since we don't have a specific GET /public/prompts/subdomain/slug yet
  const promptsRes = await apiFetchServer<any>(`/prompts?creator_id=${dbPortfolio.creator.id}&status=published`)
  const prompts = Array.isArray(promptsRes) ? promptsRes : (promptsRes?.items || [])
  const prompt = prompts.find((p: any) => p.slug === slug) // Note: this fetches all prompts, a specific endpoint would be better

  if (!prompt) return { title: 'Not Found' }

  const creator = dbPortfolio.creator
  const brand_color = dbPortfolio.theme_color

  const title = `${prompt.title} | ${creator.name}`
  const description = prompt.description ?? `Check out this ${prompt.ai_tool} prompt by ${creator.name}.`
  
  // Robust base domain detection
  const rawBaseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'creatopedia.tech'
  const baseDomain = rawBaseDomain.replace(/^https?:\/\//, '')
  
  // Construct URLs - Prefer SUBDOMAIN format for maximum compatibility (TikTok/social)
  const shareUrl = `https://${subdomain}.${baseDomain}/${slug}`
  
  // Image prioritization: 
  // 1. Explicit share image
  // 2. Thumbnail
  // 3. Fallback to the generated opengraph-image route
  let ogImageUrl = prompt.share_image_url || prompt.thumbnail_url
  
  if (!ogImageUrl) {
    // If no custom image, use the dynamic one. 
    // We use the subdomain-based absolute URL to ensure consistency.
    ogImageUrl = `https://${subdomain}.${baseDomain}/${slug}/opengraph-image`
  } else if (!ogImageUrl.startsWith('http')) {
    // Ensure relative URLs are made absolute (if any)
    ogImageUrl = `https://${baseDomain}${ogImageUrl.startsWith('/') ? '' : '/'}${ogImageUrl}`
  }

  return {
    title,
    description,
    alternates: {
      canonical: shareUrl,
    },
    openGraph: {
      title,
      description,
      url: shareUrl,
      siteName: 'Creatopedia',
      locale: 'en_US',
      type: 'article', // Using article can sometimes help with rich previews
      authors: [creator.name],
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: title,
          type: 'image/png', // Explicitly setting type helps WhatsApp
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl],
      creator: creator.handle || `@${subdomain}`,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  }
}

export default async function PublicPromptPage({ params }: Params) {
  const { subdomain, slug } = await params

  // 1. Fetch creator by subdomain (Cached)
  const creator = await getCachedCreator(subdomain)
  if (!creator) notFound()

  // 2. Fetch published prompt (Cached)
  const prompt = await getCachedPrompt(creator.subdomain, slug)
  if (!prompt) notFound()

  console.log('PROMPT FETCHED (Possibly Cached):', { id: prompt.id, title: prompt.title })

  // 3. Fetch related prompts (Cached)
  const related = await getCachedRelatedPrompts(creator.id, prompt.id)

  const isRawHtml = !!prompt.embed_html || prompt.video_url?.trim().startsWith('<')
  const oEmbedHtml = prompt.embed_html || (prompt.video_url?.trim().startsWith('<')
    ? prompt.video_url
    : (prompt.video_url ? await fetchInstagramOEmbed(prompt.video_url) : null))

  console.log({ oEmbedHtml, videoUrl: prompt.video_url, isRawHtml })

  // 5b. Fetch Rich Instagram Data for native rendering
  const igMedia = (prompt.video_url && !isRawHtml)
    ? await fetchInstagramMedia(prompt.video_url, creator.id)
    : null

  // 5c. Fetch User and Feed Data
  const igUser = await fetchInstagramUser(creator.id)
  const igFeed = await fetchInstagramFeed(creator.id)


  // 6. Fetch active ad placements for this prompt
  const now = new Date().toISOString()
  const filters = [
    `prompt_id.eq.${prompt.id}`,
    `is_global.eq.true`
  ]
  if (prompt.category_id) {
    filters.push(`category_id.eq.${prompt.category_id}`)
  }

  const rawPlacements = await apiFetchServer<AdPlacement[]>(
    `/public/ads/placements?creator_id=${creator.id}&prompt_id=${prompt.id}${
      prompt.category_id ? `&category_id=${prompt.category_id}` : ''
    }`
  )

  const placements: AdPlacement[] = (rawPlacements ?? [])
    .map((p) => {
      const raw = p
      return {
        ...raw,
        campaign: Array.isArray(raw.campaign) ? raw.campaign[0] : raw.campaign
      } as AdPlacement
    })
    .filter((p) => {
      const cam = p.campaign
      if (!cam || cam.status !== 'active') return false
      if (cam.starts_at && cam.starts_at > now) return false
      if (cam.ends_at && cam.ends_at < now) return false
      return true
    })

  console.log('PLACEMENTS LOADED:', placements.length)

  const rawBaseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'creatopedia.tech'
  const baseDomain = rawBaseDomain.replace(/^https?:\/\//, '')

  // Generate JSON-LD Structured Data for Trust
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: prompt.title,
    description: prompt.description,
    image: prompt.thumbnail_url || prompt.share_image_url || `https://${creator.subdomain}.${baseDomain}/${prompt.slug}/opengraph-image`,
    author: {
      '@type': 'Person',
      name: creator.name,
      url: `https://${creator.subdomain}.${baseDomain}`
    },
    publisher: {
      '@type': 'Organization',
      name: 'Creatopedia',
      url: `https://${baseDomain}`
    }
  }

  return (
    <main
      style={{ '--brand': creator.brand_color } as React.CSSProperties}
      className="min-h-screen bg-zinc-950 text-white"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ViewTracker key={`tracker-${prompt.id}`} pageId={prompt.id} promptId={prompt.id} creatorId={creator.id} />

      <EnhancedPublicPromptUI
        key={prompt.id}
        creator={creator}
        prompt={prompt}
        igUser={igUser}
        igMedia={igMedia}
        igFeed={igFeed}
        relatedData={related ?? []}
        adHero={
          placements.some((p: AdPlacement) => p.position === 'above_media') && (
            <AdBanner placements={placements} position="above_media" promptId={prompt.id} creatorId={creator.id} />
          )
        }
        adAbovePrompt={
          placements.some((p: AdPlacement) => p.position === 'above_prompt') && (
            <AdBanner placements={placements} position="above_prompt" promptId={prompt.id} creatorId={creator.id} />
          )
        }
        adBelowPrompt={
          placements.some((p: AdPlacement) => p.position === 'below_prompt') && (
            <AdBanner placements={placements} position="below_prompt" promptId={prompt.id} creatorId={creator.id} />
          )
        }
        adPopupPlacements={placements.filter((p: AdPlacement) => p.position === 'popup')}
        oEmbedHtml={oEmbedHtml}
      />
    </main>
  )
}

