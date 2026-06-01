import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { apiFetchServer } from '@/lib/api/server'
import { fetchInstagramUser, fetchInstagramFeed } from '@/lib/instagram'
import UserProfilePageClient from '@/components/public/UserProfilePageClient'
import { AdCampaign, Prompt } from '@/types'
import { AdPlacementData } from '@/components/public/AdBanner'
import { headers } from 'next/headers'
import CreatopediaLanding from '@/components/public/CreatopediaLanding'
import SubdomainViewTracker from '@/components/public/SubdomainViewTracker'
import { getUserBySubdomain } from '@/lib/subdomain-utils'

// ISR: cache at edge for 60s, revalidate in background.
// force-dynamic / revalidate=0 caused cold DB+Instagram hits on every request,
// which can exceed TikTok's in-app browser timeout and show a blank/error page.
export const revalidate = 60

interface Params {
  // Next may provide `params` as a plain object or a Promise depending on context.
  params: { subdomain: string } | Promise<{ subdomain: string }>
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { subdomain } = await params

  let creator = null
  try {
    creator = await getUserBySubdomain(subdomain)
  } catch (e) {
    // 404 or other error, handled below
  }

  if (!creator) {
    const headerList = await headers()
    const host = headerList.get('host') || ''
    const envBaseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'creatopedia.tech'
    const baseDomain = envBaseDomain.replace(/^https?:\/\//, '')
    const hostWithoutPort = host.split(':')[0]
    const isLocalSubdomain = hostWithoutPort.endsWith('.localhost')
    const isSubdomainHost = (hostWithoutPort !== baseDomain && hostWithoutPort.endsWith(`.${baseDomain}`)) || isLocalSubdomain

    if (isSubdomainHost) {
      return {
        title: 'Creatopedia | Where Creators Lead, World Follows',
        description: 'Join early access for Creatopedia. One platform for every creator niche. Videos, PDFs, tutorials, and paid content curated directly for audiences.',
      }
    }
    return { title: 'Creator Not Found' }
  }

  // Fetch Instagram data for avatar fallback
  const igUser = await fetchInstagramUser(creator.id)
  const avatarUrl = creator.avatar_url || igUser?.profile_picture_url

  const rawBaseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN ?? 'creatopedia.tech'
  const baseDomain = rawBaseDomain.replace(/^https?:\/\//, '')

  // Primary URL - Prefer SUBDOMAIN format for maximum compatibility with social platforms as per Independent Subdomain Architecture
  const shareUrl = `https://${creator.subdomain}.${baseDomain}`

  return {
    title: `${creator.name} – Creatopedia`,
    description: creator.bio ?? `Browse AI prompts by ${creator.name} on Creatopedia.`,
    alternates: {
      canonical: shareUrl,
    },
    openGraph: {
      title: `${creator.name} on Creatopedia`,
      description: creator.bio ?? `Browse AI prompts by ${creator.name}.`,
      images: avatarUrl ? [
        {
          url: avatarUrl,
          width: 400,
          height: 400,
          alt: creator.name,
          type: 'image/jpeg', // Standard for profile pics
        }
      ] : [],
      type: 'profile',
      url: shareUrl,
    },
    twitter: {
      card: 'summary',
      title: `${creator.name} on Creatopedia`,
      description: creator.bio ?? `Browse AI prompts by ${creator.name}.`,
      images: avatarUrl ? [avatarUrl] : [],
    },
  }
}

export default async function UserProfilePage({ params }: Params) {
  const { subdomain } = await params
  let creator = null
  try {
    creator = await getUserBySubdomain(subdomain)
  } catch (e) {
    // Handled below
  }

  const headerList = await headers()
  const host = headerList.get('host') || ''
  const envBaseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'creatopedia.tech'
  const baseDomain = envBaseDomain.replace(/^https?:\/\//, '')
  const hostWithoutPort = host.split(':')[0]
  const isLocalSubdomain = hostWithoutPort.endsWith('.localhost')
  const isSubdomainHost = (hostWithoutPort !== baseDomain && hostWithoutPort.endsWith(`.${baseDomain}`)) || isLocalSubdomain

  if (!creator) {
    if (isSubdomainHost) {
      return <CreatopediaLanding />
    }
    notFound()
  }

  const creatorForUI = {
    ...creator,
    brand_color: '#6366f1',
  }

  // 2. Fetch only published prompts for the public profile page
  const publishedPromptsRes = await apiFetchServer<any>(
    `/prompts?creator_id=${creator.id}&status=published`
  )
  const publishedPrompts = Array.isArray(publishedPromptsRes) ? publishedPromptsRes : (publishedPromptsRes?.items || [])
  const prompts = publishedPrompts

  // 3. Fetch all categories that have published prompts from this creator
  const categoryIds = [
    ...new Set((prompts ?? []).map((p: any) => p.category_id).filter(Boolean)),
  ]

  const categories = categoryIds.length > 0
    ? (await apiFetchServer<any[]>('/categories'))
        .filter((c: { id: string }) => categoryIds.includes(c.id))
    : []

  // 4. Fetch Instagram data
  const [igUser, igFeed] = await Promise.all([
    fetchInstagramUser(creator.id),
    fetchInstagramFeed(creator.id),
  ])

  // 5. Fetch ad placements
  const now = new Date().toISOString()
  let rawPlacements: AdPlacementData[] = []
  try {
    rawPlacements = await apiFetchServer<AdPlacementData[]>(
      `/public/ads/placements?creator_id=${creator.id}&page_type=creator_page`
    )
  } catch (error) {
    console.warn('Ad placements unavailable for creator page:', error)
  }

  const placements: AdPlacementData[] = (rawPlacements ?? [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((p: any) => {
      // API join might return an array or object
      const campaign = Array.isArray(p.campaign) ? p.campaign[0] : p.campaign
      return {
        ...p,
        campaign: campaign as AdCampaign
      }
    })
    .filter((p) => {
      const cam = p.campaign
      if (!cam || cam.status !== 'active') return false
      if (cam.starts_at && cam.starts_at > now) return false
      if (cam.ends_at && cam.ends_at < now) return false
      return true
    })

  const isSubdomain = hostWithoutPort.startsWith(`${creator.subdomain}.`) || hostWithoutPort === 'localhost' || hostWithoutPort === '127.0.0.1'

  // Generate JSON-LD Structured Data for Trust
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    mainEntity: {
      '@type': 'Person',
      name: creator.name,
      alternateName: creator.handle || creator.subdomain,
      description: creator.bio,
      image: creator.avatar_url || igUser?.profile_picture_url || '',
      url: `https://${creator.subdomain}.${baseDomain}`,
    }
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      <SubdomainViewTracker subdomain={creator.subdomain || subdomain} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <UserProfilePageClient
        creator={creatorForUI as any}
        igUser={igUser}
        igFeed={igFeed}
        categories={categories ?? []}
        prompts={prompts ?? []}
        adPlacements={placements}
        isSubdomain={isSubdomain}
      />
    </main>
  )
}
