'use client'

import { useState } from 'react'
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Play, Volume2, VolumeX } from 'lucide-react'
import type { InstagramMedia } from '@/lib/instagram'

interface Props {
  media: InstagramMedia
}

export default function InstagramPost({ media }: Props) {
  const [isMuted, setIsMuted] = useState(true)
  const [showFullCaption, setShowFullCaption] = useState(false)
  const [isLiked, setIsLiked] = useState(false)

  const isVideo = media.media_type === 'VIDEO'
  const displayUrl = isVideo ? media.media_url : (media.media_url || media.thumbnail_url)

  return (
    <div className="w-full max-w-[540px] mx-auto bg-white border border-zinc-100 rounded-2xl overflow-hidden mb-8 shadow-xl hover:shadow-2xl transition-all duration-500">
      <a href={media.permalink} target="_blank" rel="noopener noreferrer" className="block group">
      {/* Header */}
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-fuchsia-600 p-[2px]">
            <div className="w-full h-full rounded-full bg-white flex items-center justify-center p-[1.5px]">
              <div className="w-full h-full rounded-full bg-zinc-100 flex items-center justify-center text-[10px] font-bold text-zinc-400">
                {media.username[0].toUpperCase()}
              </div>
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-zinc-900 hover:text-zinc-600 transition-colors cursor-pointer">
              {media.username}
            </span>
            <span className="text-[10px] text-zinc-500">Original Audio</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="text-zinc-900 hover:text-zinc-500">
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.332 3.608 1.308.975.975 1.245 2.242 1.308 3.608.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.063 1.366-.333 2.633-1.308 3.608-.975.975-2.242 1.245-3.608 1.308-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.366-.063-2.633-.333-3.608-1.308-.975-.975-1.245-2.242-1.308-3.608-.058-1.266-.07-1.646-.07-4.85s.012-3.584.07-4.85c.062-1.366.332-2.633 1.308-3.608.975-.975 2.242-1.245 3.608-1.308 1.266-.058 1.646-.07 4.85-.07zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948s.014 3.667.072 4.947c.2 4.337 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072s3.667-.014 4.947-.072c4.337-.2 6.78-2.618 6.98-6.98.058-1.281.072-1.689.072-4.948s-.014-3.667-.072-4.947c-.2-4.337-2.618-6.78-6.98-6.98-1.281-.058-1.689-.072-4.948-.072zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.162 6.162 6.162 6.162-2.759 6.162-6.162-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.791-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.209-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            </svg>
          </button>
          <button className="text-zinc-900 hover:text-zinc-500">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Media Content */}
      <div className="relative aspect-square sm:aspect-[4/5] bg-zinc-50 group">
        {isVideo ? (
          <div className="relative w-full h-full cursor-pointer" onClick={() => setIsMuted(!isMuted)}>
            <video
              src={displayUrl}
              autoPlay
              loop
              muted={isMuted}
              playsInline
              className="w-full h-full object-cover"
            />
            <button
              className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity z-20"
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            
            {/* Center Play Button */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none transition-transform group-hover:scale-110 duration-500">
              <div className="w-20 h-20 rounded-full bg-black/20 backdrop-blur-[2px] flex items-center justify-center border border-white/30 shadow-2xl">
                <Play className="w-10 h-10 text-white fill-current translate-x-1" />
              </div>
            </div>
          </div>
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={displayUrl}
            alt="Instagram post"
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* Actions */}
      <div className="p-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsLiked(!isLiked)}
              className={`transition-transform active:scale-125 ${isLiked ? 'text-red-500' : 'text-zinc-900 hover:text-zinc-500'}`}
            >
              <Heart className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} />
            </button>
            <button className="text-zinc-900 hover:text-zinc-500">
              <MessageCircle className="w-6 h-6" />
            </button>
            <button className="text-zinc-900 hover:text-zinc-500">
              <Send className="w-6 h-6" />
            </button>
          </div>
          <button className="text-zinc-900 hover:text-zinc-500">
            <Bookmark className="w-6 h-6" />
          </button>
        </div>

        {/* Likes Count */}
        <div className="text-sm font-bold text-zinc-900 mb-1.5">
          {(media.like_count ?? 0) + (isLiked ? 1 : 0)} likes
        </div>

        {/* Caption Area (Fixed height for uniformity) */}
        <div className="h-12 overflow-hidden mb-2">
          {media.caption ? (
            <div className="text-sm text-zinc-800 leading-snug">
              <span className="font-bold mr-2">{media.username}</span>
              <span className="line-clamp-2">
                {media.caption}
              </span>
            </div>
          ) : (
            <div className="text-sm text-zinc-400 italic">No caption</div>
          )}
        </div>

        {/* Timestamp */}
        <div className="text-[10px] text-zinc-400 uppercase mt-2 tracking-wider">
          {new Date(media.timestamp).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Add Comment (Mock) */}
      <div className="border-t border-zinc-100 p-3 hidden sm:flex items-center justify-between">
        <input
          type="text"
          placeholder="Add a comment..."
          className="bg-transparent text-sm text-zinc-900 placeholder-zinc-400 outline-none w-full"
        />
        <button className="text-sky-500 font-bold text-sm opacity-50 cursor-default">
          Post
        </button>
      </div>
      </a>
    </div>
  )
}
