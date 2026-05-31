'use client'

import type { InstagramUser } from '@/lib/instagram'
import type { Creator } from '@/types'
import { CheckCircle2, MoreHorizontal, Grid, Film, UserSquare } from 'lucide-react'

interface Props {
  user: InstagramUser
  creator: Creator
  activeTab?: 'posts' | 'reels' | 'tagged'
  onTabChange?: (tab: 'posts' | 'reels' | 'tagged') => void
}

export default function InstagramProfile({ user, creator, activeTab, onTabChange }: Props) {
  const displayName = user.name || creator.name || user.username
  const bio = user.biography || creator.bio
  const profilePic = user.profile_picture_url || creator.avatar_url
  const followers = user.followers_count || 0
  const follows = user.follows_count || 0
  const website = user.website || creator.instagram_url

  const formatCount = (count: number) => {
    if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M'
    if (count >= 1000) return (count / 1000).toFixed(1) + 'K'
    return count.toString()
  }

  const showTabs = activeTab && onTabChange

  return (
    <div className="w-full px-4 md:px-6 pt-6 md:pt-10 pb-6 bg-zinc-950 text-white">
      <div className="flex gap-4 md:gap-10 items-start">
        {/* Profile Pic */}
        <div className="relative shrink-0 mt-1">
          <div className="w-20 h-20 md:w-32 md:h-32 rounded-full bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] p-[3px] shadow-sm">
            <div className="w-full h-full rounded-full bg-zinc-950 p-[2px]">
              <div className="w-full h-full rounded-full bg-zinc-900 overflow-hidden ring-1 ring-white/10">
                {profilePic ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={profilePic} alt={user.username} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-zinc-700">
                    {user.username[0].toUpperCase()}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 flex flex-col gap-4 w-full">
          {/* Header Row */}
          <div className="flex flex-wrap items-center gap-y-3 gap-x-4">
            <h1 className="text-xl md:text-2xl font-normal text-white flex items-center gap-2 mr-2">
              {user.username}
              <CheckCircle2 className="w-5 h-5 text-[#0095f6] fill-current" />
            </h1>
            <div className="flex items-center gap-2">
              <button className="bg-[#0095f6] hover:bg-[#1877f2] text-white font-semibold py-1.5 px-5 md:px-6 rounded-lg text-sm transition-colors active:scale-95">
                Follow
              </button>
              <button className="bg-zinc-800 hover:bg-zinc-700 text-white font-semibold py-1.5 px-5 md:px-6 rounded-lg text-sm transition-colors active:scale-95">
                Message
              </button>
              <button className="bg-zinc-800 hover:bg-zinc-700 text-white p-1.5 rounded-lg transition-colors flex items-center justify-center">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Stats Row */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 md:gap-x-10 text-sm md:text-[15px] mt-1">
            <div className="flex items-center gap-1">
              <span className="font-semibold text-white">{user.media_count}</span>
              <span className="text-zinc-400">posts</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-semibold text-white">{formatCount(followers)}</span>
              <span className="text-zinc-400">followers</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-semibold text-white">{formatCount(follows)}</span>
              <span className="text-zinc-400">following</span>
            </div>
          </div>

          {/* Bio Section */}
          <div className="flex flex-col gap-0.5 text-sm mt-1">
            <span className="font-semibold text-white">{displayName}</span>
            {bio && (
              <p className="text-zinc-100 whitespace-pre-wrap leading-tight max-w-md">
                {bio}
              </p>
            )}
            {website && (
              <a 
                href={website.startsWith('http') ? website : `https://${website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#e0f1ff] font-semibold hover:underline mt-1"
              >
                {website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Profile Tabs */}
      {showTabs && (
        <div className="border-t border-zinc-800 flex justify-center gap-12 mt-8 -mx-6 md:mx-0 px-6 md:px-0">
          <button 
            onClick={() => onTabChange('posts')}
            className={`flex items-center gap-1.5 py-4 border-t -mt-px text-xs font-bold uppercase tracking-widest transition-colors ${
              activeTab === 'posts' ? 'border-white text-white' : 'border-transparent text-zinc-500 hover:text-zinc-400'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            Posts
          </button>
          <button 
            onClick={() => onTabChange('reels')}
            className={`flex items-center gap-1.5 py-4 border-t -mt-px text-xs font-bold uppercase tracking-widest transition-colors ${
              activeTab === 'reels' ? 'border-white text-white' : 'border-transparent text-zinc-500 hover:text-zinc-400'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            Reels
          </button>
          <button 
            onClick={() => onTabChange('tagged')}
            className={`flex items-center gap-1.5 py-4 border-t -mt-px text-xs font-bold uppercase tracking-widest transition-colors ${
              activeTab === 'tagged' ? 'border-white text-white' : 'border-transparent text-zinc-500 hover:text-zinc-400'
            }`}
          >
            <UserSquare className="w-3.5 h-3.5" />
            Tagged
          </button>
        </div>
      )}
    </div>
  )
}

