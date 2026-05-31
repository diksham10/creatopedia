'use client'

import { useState, useEffect } from 'react'
import { X, Play, RefreshCw, Search, Loader2 } from 'lucide-react'
import { apiFetch } from '@/lib/api/client'

export interface InstagramPost {
  id: string
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM'
  media_url: string
  thumbnail_url?: string
  caption?: string
  permalink: string
  timestamp: string
}

interface Props {
  isOpen: boolean
  onClose: () => void
  onSelect: (post: InstagramPost) => void
}

export default function InstagramPostPicker({ isOpen, onClose, onSelect }: Props) {
  const [posts, setPosts] = useState<InstagramPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (isOpen) {
      fetchPosts()
    }
  }, [isOpen])

  async function fetchPosts() {
    setLoading(true)
    setError(null)
    try {
      const data = await apiFetch<InstagramPost[]>('/instagram/posts')
      if (Array.isArray(data)) {
        setPosts(data)
      } else {
        setPosts((data as any).posts || [])
      }
    } catch (err) {
      setError('Failed to fetch Instagram posts. Please ensure Instagram is connected in settings.')
    } finally {
      setLoading(false)
    }
  }

  const filteredPosts = searchTerm
    ? posts.filter(post => (post.caption ?? '').toLowerCase().includes(searchTerm.toLowerCase()))
    : posts

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => { document.body.style.overflow = 'unset' }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-8">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight">Select Instagram Post</h3>
            <p className="text-zinc-500 text-xs mt-1">Choose a post to auto-fill the prompt details.</p>
          </div>
          <div className="relative ml-auto mr-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search captions..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 w-44"
            />
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
              <p className="text-zinc-500 text-sm font-medium">Fetching your latest posts...</p>
            </div>
          ) : error ? (
            <div className="h-64 flex flex-col items-center justify-center text-center px-4">
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                <X className="w-8 h-8 text-red-500" />
              </div>
              <p className="text-white font-bold mb-2">Something went wrong</p>
              <p className="text-zinc-500 text-sm max-w-xs mx-auto mb-6">{error}</p>
              <button 
                onClick={fetchPosts}
                className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-sm font-bold transition-all"
              >
                Try Again
              </button>
            </div>
          ) : posts.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center">
              <p className="text-zinc-500">No posts found on your account.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {filteredPosts.map((post) => (
                <button
                  key={post.id}
                  onClick={() => onSelect(post)}
                  className="group relative aspect-square rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800 hover:border-indigo-500 transition-all shadow-lg text-left"
                >
                  <img
                    src={post.media_type === 'VIDEO' ? (post.thumbnail_url || post.media_url) : post.media_url}
                    alt={post.caption || 'Instagram Post'}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-70 group-hover:opacity-100"
                  />
                  {post.media_type === 'VIDEO' && (
                    <div className="absolute top-2 right-2 p-1.5 bg-black/50 backdrop-blur-md rounded-lg">
                      <Play className="w-3 h-3 text-white fill-current" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                    <p className="text-[10px] text-white line-clamp-2 font-medium leading-tight">
                      {post.caption || 'No caption'}
                    </p>
                  </div>
                  <div className="absolute inset-0 border-2 border-transparent group-hover:border-indigo-500/50 rounded-2xl transition-all" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/50 flex items-center justify-between">
          <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest px-2">
            {posts.length} Posts Available
          </p>
          <button 
            onClick={fetchPosts}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-zinc-400 hover:text-white text-xs font-bold transition-colors"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>
    </div>
  )
}
