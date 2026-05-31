'use client'

import { useState, useEffect } from 'react'
import { Play, Loader2, Calendar } from 'lucide-react'

interface InstagramPost {
  id: string
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM'
  media_url: string
  thumbnail_url?: string
  caption?: string
  permalink: string
  timestamp: string
  like_count?: number
}

export default function InstagramOAuthFeed() {
  const [posts, setPosts] = useState<InstagramPost[]>([])
  const [loading, setLoading] = useState(true)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)

  useEffect(() => {
    fetchPosts()
  }, [])

  async function fetchPosts(cursor?: string) {
    if (cursor) setLoadingMore(true)
    else setLoading(true)

    try {
      const url = new URL('/api/instagram/posts', window.location.origin)
      if (cursor) url.searchParams.set('after', cursor)
      
      const res = await fetch(url.toString())
      const data = await res.json()
      
      if (data.posts) {
        setPosts(prev => cursor ? [...prev, ...data.posts] : data.posts)
        setNextCursor(data.paging?.cursors?.after || null)
      }
    } catch (err) {
      console.error('Failed to fetch Instagram posts')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    return `${days} days ago`
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="aspect-square bg-zinc-900 rounded-2xl border border-zinc-800" />
        ))}
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <div className="py-20 text-center border-2 border-dashed border-zinc-800 rounded-3xl">
        <p className="text-zinc-500 font-medium">No posts found. Make sure your account is public.</p>
      </div>
    )
  }

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map(post => (
          <a
            key={post.id}
            href={post.permalink}
            target="_blank"
            rel="noopener noreferrer"
            className="group bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-600 transition-all shadow-lg hover:-translate-y-1"
          >
            {/* Thumbnail */}
            <div className="relative aspect-square overflow-hidden bg-zinc-800">
              <img
                src={post.media_type === 'VIDEO' ? post.thumbnail_url : post.media_url}
                alt={post.caption || 'Instagram Post'}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              {post.media_type === 'VIDEO' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <Play className="w-10 h-10 text-white fill-current drop-shadow-2xl" />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
              {post.caption && (
                <p className="text-sm text-zinc-300 line-clamp-2 leading-relaxed">
                  {post.caption.length > 80 ? post.caption.slice(0, 80) + '...' : post.caption}
                </p>
              )}
              <div className="flex items-center justify-between pt-2 border-t border-zinc-800/50">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                  <Calendar className="w-3 h-3" />
                  {formatTime(post.timestamp)}
                </div>
                {post.like_count !== undefined && (
                  <span className="text-[10px] font-bold text-zinc-500">❤️ {post.like_count}</span>
                )}
              </div>
            </div>
          </a>
        ))}
      </div>

      {nextCursor && (
        <div className="flex justify-center">
          <button
            onClick={() => fetchPosts(nextCursor)}
            disabled={loadingMore}
            className="px-10 py-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-bold hover:bg-zinc-800 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
          >
            {loadingMore ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading...
              </>
            ) : (
              'Load More Posts'
            )}
          </button>
        </div>
      )}
    </div>
  )
}
