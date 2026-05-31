import { apiFetchServer } from '@/lib/api/server'

export interface InstagramMedia {
  id: string
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM'
  media_url: string
  permalink: string
  thumbnail_url?: string
  timestamp: string
  caption?: string
  username: string
  like_count?: number
  comments_count?: number
}

export interface InstagramUser {
  id: string
  username: string
  media_count: number
  biography?: string
  followers_count?: number
  follows_count?: number
  profile_picture_url?: string
  name?: string
  website?: string
}

import { unstable_cache } from 'next/cache'

const CACHE_TTL = 300 // 5 minutes in seconds

async function fetchInstagramUserRaw(creatorId?: string): Promise<InstagramUser | null> {
  if (!creatorId) return null
  return await apiFetchServer<InstagramUser | null>(
    `/public/instagram/${creatorId}/user`
  )
}

export const fetchInstagramUser = (creatorId?: string) => 
  unstable_cache(
    async () => fetchInstagramUserRaw(creatorId),
    ['ig-user', creatorId || 'none'],
    { revalidate: CACHE_TTL, tags: [`ig-user-${creatorId}`] }
  )()

async function fetchInstagramFeedRaw(creatorId?: string, limit: number = 100): Promise<InstagramMedia[]> {
  if (!creatorId) return []
  return await apiFetchServer<InstagramMedia[]>(
    `/public/instagram/${creatorId}/feed?limit=${limit}`
  )
}

export const fetchInstagramFeed = (creatorId?: string, limit: number = 100) => 
  unstable_cache(
    async () => fetchInstagramFeedRaw(creatorId, limit),
    ['ig-feed', creatorId || 'none', String(limit)],
    { revalidate: CACHE_TTL, tags: [`ig-feed-${creatorId}`] }
  )()

async function fetchInstagramMediaRaw(url: string, creatorId?: string): Promise<InstagramMedia | null> {
  if (!creatorId) return null
  return await apiFetchServer<InstagramMedia | null>(
    `/public/instagram/${creatorId}/media?url=${encodeURIComponent(url)}`
  )
}

export const fetchInstagramMedia = (url: string, creatorId?: string) => 
  unstable_cache(
    async () => fetchInstagramMediaRaw(url, creatorId),
    ['ig-media', creatorId || 'none', url],
    { revalidate: CACHE_TTL, tags: [`ig-media-${creatorId}`] }
  )()
