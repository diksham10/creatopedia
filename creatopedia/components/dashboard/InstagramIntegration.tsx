'use client'

import { useState, useEffect } from 'react'
import { CheckCircle2, RefreshCw, LogOut, AlertCircle, Loader2, Play, ShieldCheck } from 'lucide-react'
import { apiFetch } from '@/lib/api/client'

interface InstagramStatus {
  is_connected: boolean
  username?: string
  expires_at?: string
}

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

export default function InstagramIntegration() {
  const [status, setStatus] = useState<InstagramStatus | null>(null)
  const [posts, setPosts] = useState<InstagramPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('instagram_code')
    const state = params.get('state')

    if (code && state) {
      handleCallback(code, state)
    } else {
      fetchStatus()
    }
  }, [])

  async function handleCallback(code: string, state: string) {
    try {
      await apiFetch(`/instagram/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`)
      
      // Clean up URL
      const newUrl = window.location.pathname
      window.history.replaceState({}, document.title, newUrl)
      
      fetchStatus()
    } catch (err) {
      setError('Failed to complete Instagram link')
      setLoading(false)
    }
  }

  async function fetchStatus() {
    try {
      const data = await apiFetch<InstagramStatus>('/instagram/status')
      setStatus(data)
      if (data.is_connected) {
        fetchPosts()
      }
    } catch (err) {
      setError('Failed to load Instagram status')
    } finally {
      setLoading(false)
    }
  }

  async function fetchPosts() {
    setRefreshing(true)
    try {
      const data = await apiFetch<InstagramPost[]>('/instagram/posts')
      if (Array.isArray(data)) {
        setPosts(data)
      } else if ((data as any).posts) {
        setPosts((data as any).posts)
      }
    } catch (err) {
      console.error('Failed to fetch posts')
    } finally {
      setRefreshing(false)
    }
  }

  async function handleConnect() {
    try {
      const data = await apiFetch<{url: string}>('/instagram/auth-url')
      if (data.url) {
        window.location.href = data.url
      }
    } catch (err) {
      setError('Failed to generate connection link')
    }
  }

  async function handleDisconnect() {
    if (!confirm('Are you sure you want to disconnect your Instagram account?')) return
    
    setLoading(true)
    try {
      await apiFetch('/instagram/disconnect', { method: 'POST' })
      setStatus({ is_connected: false })
      setPosts([])
    } catch (err) {
      setError('Failed to disconnect')
    } finally {
      setLoading(false)
    }
  }

  const formatExpiry = (dateStr: string) => {
    const expires = new Date(dateStr)
    const diff = expires.getTime() - Date.now()
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
    return `in ${days} days`
  }

  if (loading) {
    return (
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 animate-pulse space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-zinc-900" />
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-zinc-900 rounded w-1/4" />
            <div className="h-3 bg-zinc-900 rounded w-1/2" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-3xl p-6 flex items-start gap-4">
        <AlertCircle className="w-6 h-6 text-red-500 mt-1" />
        <div className="flex-1">
          <h3 className="text-white font-bold mb-1">Connection Failed</h3>
          <p className="text-zinc-400 text-sm mb-4">{error}</p>
          <button
            onClick={() => { setError(null); fetchStatus(); }}
            className="px-4 py-2 rounded-xl bg-red-500 text-white text-xs font-bold"
          >
            Retry Connection
          </button>
        </div>
      </div>
    )
  }

  if (!status?.is_connected) {
    return (
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8 transition-all hover:border-zinc-700 shadow-2xl">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] flex items-center justify-center shadow-2xl animate-in zoom-in duration-500">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <div className="flex-1 text-center md:text-left space-y-2">
            <h3 className="text-2xl font-bold text-white tracking-tight">Instagram</h3>
            <p className="text-zinc-500 text-sm leading-relaxed max-w-sm">
              Connect your Business or Creator account to embed Reels and automate prompt delivery.
            </p>
          </div>
          <button
            onClick={handleConnect}
            className="w-full md:w-auto px-10 py-4 rounded-2xl bg-white text-black font-black hover:bg-zinc-200 transition-all active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.1)] flex items-center justify-center gap-3"
          >
            Connect Instagram
          </button>
        </div>
        <div className="mt-8 pt-8 border-t border-zinc-900 flex items-center justify-center md:justify-start gap-2.5 text-[11px] text-zinc-600 font-bold uppercase tracking-widest">
          <ShieldCheck className="w-4 h-4 text-emerald-500/80" />
          Secured · We never store passwords
        </div>
      </div>
    )
  }

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl animate-in fade-in duration-500">
      <div className="p-8 border-b border-zinc-900 flex flex-col md:flex-row items-center gap-8">
        <div className="relative group">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] flex items-center justify-center shadow-2xl group-hover:rotate-6 transition-transform duration-500">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center border-4 border-zinc-950 shadow-lg animate-in zoom-in delay-300">
            <CheckCircle2 className="w-4 h-4 text-white" />
          </div>
        </div>

        <div className="flex-1 text-center md:text-left space-y-2">
          <h3 className="text-2xl font-bold text-white tracking-tight">Instagram · @{status.username}</h3>
          <p className="flex items-center justify-center md:justify-start gap-2 text-sm font-bold">
            <span className="text-emerald-500">Connected</span>
            <span className="w-1 h-1 rounded-full bg-zinc-800" />
            <span className="text-zinc-500">Token expires {formatExpiry(status.expires_at!)}</span>
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={fetchPosts}
            disabled={refreshing}
            className="flex-1 md:flex-none px-6 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs font-bold hover:bg-zinc-800 transition-all flex items-center justify-center gap-2.5"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Feed
          </button>
          <button
            onClick={handleDisconnect}
            className="flex-1 md:flex-none px-6 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2.5"
          >
            <LogOut className="w-4 h-4" />
            Disconnect
          </button>
        </div>
      </div>

      {/* Mini Grid Preview */}
      <div className="p-8 bg-zinc-900/20">
        <div className="flex items-center justify-between mb-6">
          <h4 className="text-xs font-black text-zinc-600 uppercase tracking-[0.2em]">Recent Activity</h4>
          {refreshing && <Loader2 className="w-4 h-4 text-zinc-700 animate-spin" />}
        </div>

        {posts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {posts.slice(0, 6).map(post => (
              <a
                key={post.id}
                href={post.permalink}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative aspect-square rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 hover:border-zinc-500 transition-all shadow-lg"
              >
                <img
                  src={post.media_type === 'VIDEO' ? post.thumbnail_url : post.media_url}
                  alt={post.caption || 'Instagram post'}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                {post.media_type === 'VIDEO' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/0 transition-colors">
                    <Play className="w-8 h-8 text-white fill-current opacity-90 drop-shadow-2xl" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                  <span className="text-[10px] font-black text-white uppercase tracking-widest border border-white/20 px-3 py-1.5 rounded-lg bg-white/5">View on IG</span>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="h-32 flex flex-col items-center justify-center border-2 border-dashed border-zinc-900 rounded-3xl bg-zinc-950/50">
            <svg viewBox="0 0 24 24" className="w-6 h-6 text-zinc-800 mb-2 fill-current">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.332 3.608 1.308.975.975 1.245 2.242 1.308 3.608.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.063 1.366-.333 2.633-1.308 3.608-.975.975-2.242 1.245-3.608 1.308-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.366-.063-2.633-.333-3.608-1.308-.975-.975-1.245-2.242-1.308-3.608-.058-1.266-.07-1.646-.07-4.85s.012-3.584.07-4.85c.062-1.366.332-2.633 1.308-3.608.975-.975 2.242-1.245 3.608-1.308 1.266-.058 1.646-.07 4.85-.07zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948s.014 3.667.072 4.947c.2 4.337 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072s3.667-.014 4.947-.072c4.337-.2 6.78-2.618 6.98-6.98.058-1.281.072-1.689.072-4.948s-.014-3.667-.072-4.947c-.2-4.337-2.618-6.78-6.98-6.98-1.281-.058-1.689-.072-4.948-.072zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.162 6.162 6.162 6.162-2.759 6.162-6.162-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.791-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.209-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            </svg>
            <p className="text-zinc-600 text-[11px] font-bold uppercase tracking-widest">No posts found to preview</p>
          </div>
        )}
      </div>
    </div>
  )
}
