'use client'

import { useState } from 'react'
import InstagramProfile from './InstagramProfile'
import InstagramFeed from './InstagramFeed'
import type { InstagramUser, InstagramMedia } from '@/lib/instagram'
import type { Creator } from '@/types'

interface Props {
  user: InstagramUser
  feed: InstagramMedia[]
  creator: Creator
  excludeId?: string
}

export default function InstagramView({ user, feed, creator, excludeId }: Props) {
  const [activeTab, setActiveTab] = useState<'posts' | 'reels' | 'tagged'>('posts')

  return (
    <div className="w-full bg-zinc-950">
      <InstagramProfile 
        user={user} 
        creator={creator} 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
      />
      <div className="pb-16 bg-zinc-950">
        <InstagramFeed 
          feed={feed} 
          excludeId={excludeId} 
          filter={activeTab} 
        />
      </div>
    </div>
  )
}
