'use client'

import { useState } from 'react'
import type { InstagramMedia } from '@/lib/instagram'
import { ChevronDown, Heart, MessageCircle, Play } from 'lucide-react'

interface Props {
  feed: InstagramMedia[]
  excludeId?: string
  filter?: 'posts' | 'reels' | 'tagged'
}

export default function InstagramFeed({ feed, excludeId, filter = 'posts' }: Props) {
  const [visibleCount, setVisibleCount] = useState(12)
  
  const filteredFeed = feed.filter(m => {
    if (m.id === excludeId) return false
    if (filter === 'posts') return m.media_type === 'IMAGE' || m.media_type === 'CAROUSEL_ALBUM'
    if (filter === 'reels') return m.media_type === 'VIDEO'
    return true // tagged
  })

  const visiblePosts = filteredFeed.slice(0, visibleCount)
  const hasMore = visibleCount < filteredFeed.length

  if (filteredFeed.length === 0) {
    return (
      <div className="w-full py-20 text-center text-zinc-500 bg-zinc-950">
        No {filter === 'reels' ? 'reels' : 'posts'} found.
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-12 w-full max-w-4xl mx-auto px-4 md:px-0 bg-zinc-950">
      <div className="grid grid-cols-3 gap-0.5 md:gap-1 w-full bg-zinc-950">
        {visiblePosts.map(post => (
          <a 
            key={post.id} 
            href={post.permalink}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative aspect-square bg-zinc-900 overflow-hidden cursor-pointer"
          >
            {/* Image / Video Thumbnail */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={post.media_type === 'VIDEO' ? (post.thumbnail_url || post.media_url) : post.media_url} 
              alt={post.caption || 'Instagram post'} 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />

            {/* Video Icon */}
            {post.media_type === 'VIDEO' && (
              <Play className="absolute top-2 right-2 w-4 h-4 text-white fill-current drop-shadow-md" />
            )}

            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-4 md:gap-8 text-white font-bold text-sm md:text-base">
              <div className="flex items-center gap-1.5">
                <Heart className="w-5 h-5 md:w-6 md:h-6 fill-current" />
                <span>{post.like_count || 0}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MessageCircle className="w-5 h-5 md:w-6 md:h-6 fill-current" />
                <span>{post.comments_count || 0}</span>
              </div>
            </div>
          </a>
        ))}
      </div>
      
      {hasMore && (
        <button
          onClick={() => setVisibleCount(prev => prev + 12)}
          className="flex items-center gap-2 px-8 py-3 rounded-full border border-zinc-800 text-white font-bold text-sm hover:bg-zinc-900 transition-all active:scale-95 shadow-sm"
        >
          Load More
          <ChevronDown className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
