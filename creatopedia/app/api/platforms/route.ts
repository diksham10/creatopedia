import { NextResponse } from 'next/server'
import { axiosClient } from '@/lib/api/axiosClient'

export async function GET() {
  const base = axiosClient.defaults.baseURL?.replace(/\/$/, '') ?? ''

  // Fetch using the standard public endpoints available in the API
  const [categoriesRes, promptsRes] = await Promise.all([
    axiosClient.get(`${base}/categories`).catch(() => ({ data: [] })),
    axiosClient.get(`${base}/prompts`, { params: { status: 'published' } }).catch(() => ({ data: { items: [] } })),
  ])

  // Fallback empty raw creators since there is no public `/creators` list API yet
  const rawCreators: any[] = []

  // Fetch igFeed per creator to get live Instagram thumbnails
  const igFeedByCreator: Record<string, Record<string, string>> = {}
  await Promise.all(
    rawCreators.map(async (c: { id: string; avatar_url?: string | null }) => {
      try {
        const { fetchInstagramFeed } = await import('@/lib/instagram')
        const feed = await fetchInstagramFeed(c.id)
        const map: Record<string, string> = {}
        for (const m of feed) {
          if (m.permalink) {
            const displayUrl = m.media_type === 'VIDEO' ? (m.thumbnail_url || m.media_url) : m.media_url
            if (displayUrl) map[m.permalink] = displayUrl
          }
        }
        igFeedByCreator[c.id] = map
      } catch {
        igFeedByCreator[c.id] = {}
      }
    })
  )

  const creators = await Promise.all(
    rawCreators.map(async (c: { id: string, avatar_url?: string | null }) => {
      if (c.avatar_url) {
        return c
      }
      try {
        const { fetchInstagramUser } = await import('@/lib/instagram')
        const igUser = await fetchInstagramUser(c.id)
        if (igUser?.profile_picture_url) {
          return { ...c, avatar_url: igUser.profile_picture_url }
        }
      } catch (e) {
        console.error('Failed to fetch fallback instagram picture', e)
      }
      return {
        ...c,
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80'
      }
    })
  )

  // Attach ig_thumbnail_url to each prompt
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const promptsArray = promptsRes.data?.items ? promptsRes.data.items : (Array.isArray(promptsRes.data) ? promptsRes.data : [])
  const prompts = promptsArray.map((p: any) => {
    const feedMap = igFeedByCreator[p.creator_id] || {}
    const igThumb = p.video_url ? feedMap[p.video_url] : null
    return { ...p, ig_thumbnail_url: igThumb || null }
  })

  return NextResponse.json({
    categories: categoriesRes.data || [],
    creators,
    prompts
  }, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'
    }
  })
}
