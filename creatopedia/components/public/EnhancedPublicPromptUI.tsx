'use client'

import { useState, useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { LayoutGrid, Globe, ArrowLeft, Sparkles, FileText, Image as ImageIcon, Video, Code, Music, ChevronRight, Grid3x3, BadgeCheck, Check, List } from 'lucide-react'
import { apiFetch } from '@/lib/api/client'
import Link from 'next/link'
import { InstagramVerifiedBadge } from '@/components/ui/InstagramVerifiedBadge'





const InstagramIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
)

import PromptGate from './PromptGate'
import dynamic from 'next/dynamic'

const RelatedPrompts = dynamic(() => import('./RelatedPrompts'), { ssr: false })
import AdPopup from './AdPopup'
import type { AdPlacementData } from './AdBanner'
import type { InstagramUser, InstagramMedia } from '@/lib/instagram'
import type { Creator, Prompt, Category } from '@/types'



interface RelatedPromptType {
  id: string
  title: string
  slug: string
  ai_tool: string
  output_type: string
  thumbnail_url: string | null
}

interface Props {
  creator: Creator
  prompt: Prompt
  igUser: InstagramUser | null
  igMedia: InstagramMedia | null
  igFeed: InstagramMedia[]
  relatedData: RelatedPromptType[]
  adHero?: React.ReactNode
  adAbovePrompt?: React.ReactNode
  adBelowPrompt?: React.ReactNode
  adPopupPlacements?: AdPlacementData[]
  oEmbedHtml?: string | null
}

const AI_TOOL_COLORS: Record<string, string> = {
  Midjourney: '#1b6ef3',
  ChatGPT: '#10a37f',
  Claude: '#c96442',
  Gemini: '#4285f4',
  Runway: '#7c3aed',
  Pika: '#ec4899',
  Kling: '#f59e0b',
  Veo: '#06b6d4',
  Other: '#6366f1',
}

const OUTPUT_ICONS: Record<string, React.ReactNode> = {
  image: <ImageIcon className="w-3.5 h-3.5" />,
  video: <Video className="w-3.5 h-3.5" />,
  text: <FileText className="w-3.5 h-3.5" />,
  code: <Code className="w-3.5 h-3.5" />,
  audio: <Music className="w-3.5 h-3.5" />,
}

const GATE_LABELS: Record<string, { label: string; color: string }> = {
  open: { label: 'Free', color: '#10a37f' },
  email: { label: 'Email', color: '#f59e0b' },
  payment: { label: 'Paid', color: '#6366f1' },
}

export default function EnhancedPublicPromptUI({
  creator,
  prompt,
  igUser,
  igMedia,
  relatedData,
  adHero,
  adAbovePrompt,
  adBelowPrompt,
  adPopupPlacements,
  oEmbedHtml
}: Props) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'prompt' | 'profile'>('prompt')
  const [showDebug, setShowDebug] = useState(false)

  // ─── Query for Related Prompts (Updates when prompt changes) ───
  const { data: dynamicRelatedData } = useQuery({
    queryKey: ['related-prompts', creator.id, prompt.id],
    queryFn: async () => {
      if (!prompt.id) return []
      const data = await apiFetch<RelatedPromptType[]>(
        `/public/prompts?creator_id=${creator.id}&status=published`
      )
      return (data || []).filter((p) => p.id !== prompt.id).slice(0, 6)
    },
    initialData: relatedData,
    enabled: !!prompt.id,
    staleTime: 1000 * 60 * 5,
  })

  // Use the filtered list for rendering
  const finalRelatedData = useMemo(() => {
    return (dynamicRelatedData || []).filter(p => p.id !== prompt.id)
  }, [dynamicRelatedData, prompt.id])

  const [libraryPrompts, setLibraryPrompts] = useState<Prompt[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')

  const postCount = igUser?.media_count ?? 28
  const followerCount = igUser?.followers_count
    ? igUser.followers_count >= 1000000
      ? (igUser.followers_count / 1000000).toFixed(1) + 'M'
      : igUser.followers_count >= 1000
        ? (igUser.followers_count / 1000).toFixed(1) + 'k'
        : igUser.followers_count
    : '12.5k'
  const followingCount = igUser?.follows_count
    ? igUser.follows_count >= 1000
      ? (igUser.follows_count / 1000).toFixed(1) + 'k'
      : igUser.follows_count
    : '1.1k'

  useEffect(() => {
    async function fetchLibrary() {
      try {
        const promptsData = await apiFetch<Prompt[]>(
          `/public/prompts?creator_id=${creator.id}&status=published`
        )
        setLibraryPrompts(promptsData || [])

        const categoryIds = [
          ...new Set((promptsData || []).map((p) => p.category_id).filter(Boolean)),
        ]

        if (categoryIds.length > 0) {
          const catData = await apiFetch<Category[]>('/categories')
          setCategories(catData.filter((c) => categoryIds.includes(c.id)))
        }
      } catch (e) {
        console.error('Failed to fetch prompt library', e)
      }
    }

    if (creator?.id) {
      fetchLibrary()
    }
  }, [creator.id])

  const activeCategoryIds = useMemo(() => {
    const ids = new Set(libraryPrompts.map(p => p.category_id).filter(Boolean))
    return categories.filter(c => ids.has(c.id))
  }, [categories, libraryPrompts])

  const filteredLibraryPrompts = useMemo(() => {
    if (!activeCategory) return libraryPrompts
    return libraryPrompts.filter(p => p.category_id === activeCategory)
  }, [libraryPrompts, activeCategory])

  const handleLibraryPromptClick = async (clickedPrompt: Prompt | RelatedPromptType) => {
    setActiveTab('prompt')
    handlePromptClick(clickedPrompt)
  }

  useEffect(() => {
    // Enable debug mode if ?debug=true is in URL
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('debug') === 'true') {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setShowDebug(true)
      }
    }
  }, [])

  const handlePromptClick = (clickedPrompt: RelatedPromptType) => {
    window.scrollTo({ top: 0, behavior: 'smooth' })

    // Use Next.js router for proper navigation
    const newPath = (() => {
      const hostname = window.location.hostname
      const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN?.replace(/^https?:\/\//, '') || 'creatopedia.tech'
      const isSubdomain = hostname.startsWith(`${creator.subdomain}.`)
      if (hostname === baseDomain || hostname === 'localhost' || hostname === '127.0.0.1' || !isSubdomain) {
        return `/${creator.subdomain}/${clickedPrompt.slug}`
      }
      return `/${clickedPrompt.slug}`
    })()

    router.push(newPath)
  }

  const toolColor = AI_TOOL_COLORS[prompt.ai_tool.split(',')[0].trim()] ?? '#6366f1'

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-20 text-white select-none relative overflow-hidden">
      {/* ─── Hero Cover & Header Section ─── */}
      <div className="relative w-full overflow-hidden select-none mb-4 animate-in fade-in duration-500">
        {/* Cover Image Background */}
        <div className="relative h-[200px] md:h-[260px] w-full bg-zinc-900 select-none">
          {/* Top action buttons: Back and For Sponsors */}
          <div className="absolute top-4 left-4 right-4 z-30 flex items-center justify-between select-none">
            <button
              onClick={() => {
                if (typeof window !== 'undefined' && window.history.length > 1) {
                  window.history.back()
                } else {
                  window.location.href = '/'
                }
              }}
              className="px-3.5 py-2.5 bg-zinc-900/60 hover:bg-zinc-800/80 backdrop-blur-md border border-white/10 hover:border-white/20 text-white rounded-full flex items-center gap-2 text-xs font-mono tracking-wider transition-all duration-300 shadow-xl select-none"
            >
              <ArrowLeft className="w-4 h-4 text-white" />
              <span>Back</span>
            </button>
            <a
              href="https://creatopedia.tech/reach-us"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2.5 bg-zinc-900/60 hover:bg-zinc-800/80 backdrop-blur-md border border-white/10 hover:border-white/20 text-white rounded-full flex items-center gap-2 text-xs font-mono tracking-wider transition-all duration-300 shadow-xl select-none"
            >
              <Globe className="w-4 h-4 text-white" />
              <span> Advertise</span>
            </a>
          </div>
          <div className="absolute inset-0 bg-linear-to-t from-zinc-950 via-zinc-950/60 to-transparent z-10" />
          <div
            className="absolute inset-0 select-none opacity-40 transition-all duration-700"
            style={{
              background: `linear-gradient(135deg, ${creator.brand_color || '#6366f1'}33 0%, #09090b 100%)`
            }}
          />
        </div>

        {/* Profile Details overlapping cover image */}
        <div className="max-w-4xl mx-auto px-6 -mt-20 md:-mt-24 relative z-20 pb-4 select-none animate-in fade-in duration-500">
          <div className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6 hover:border-white/20 transition-all duration-500">
            {/* Left Column with Avatar, Name, and Info */}
            <div className="flex flex-row items-center gap-4 sm:gap-6 text-left w-full md:w-auto">
              {/* Large Avatar with Verification Badge */}
              <div className="relative group select-none shrink-0">
                <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-full p-[3px] bg-gradient-to-tr from-[#3b82f6] via-[#a855f7] to-[#ec4899] shadow-2xl hover:scale-105 transition-transform duration-500 select-none">
                  <div className="w-full h-full rounded-full bg-zinc-950 p-1">
                    {creator.avatar_url ? (
                      <img
                        src={creator.avatar_url}
                        alt={creator.name}
                        className="w-full h-full rounded-full object-cover border border-white/10 select-none"
                      />
                    ) : igUser?.profile_picture_url ? (
                      <img
                        src={igUser.profile_picture_url}
                        alt={creator.name}
                        className="w-full h-full rounded-full object-cover border border-white/10 select-none"
                      />
                    ) : (
                      <div
                        className="w-full h-full rounded-full flex items-center justify-center text-2xl md:text-3xl font-black font-sans tracking-tight select-none"
                        style={{ background: `${creator.brand_color || '#6366f1'}22`, color: creator.brand_color || '#6366f1' }}
                      >
                        {creator.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>


              </div>

              {/* Name and stats */}
              <div className="flex flex-col gap-2 sm:gap-3 select-none flex-1">
                <div>
                  <div className="flex items-center justify-start gap-2">
                    <h1 className="text-xl md:text-3xl font-black text-white tracking-tight select-none leading-tight flex items-center gap-2 md:gap-3">
                      {creator.name}
                      <InstagramVerifiedBadge className="w-4 h-4 md:w-6 md:h-6" />
                    </h1>
                  </div>
                  <span className="text-[11px] md:text-xs font-mono text-white/50 tracking-wide font-light">
                    {creator.handle || `@${creator.subdomain}`}
                  </span>
                  {igUser?.biography && (
                    <p className="text-xs font-sans text-white/70 mt-1 md:max-w-md line-clamp-2 select-none leading-relaxed">
                      {igUser.biography}
                    </p>
                  )}
                </div>

                {/* Followers, Following and Post Stats */}
                <div className="flex items-center justify-start gap-3 sm:gap-4 text-[11px] sm:text-xs font-sans text-white/80">
                  <div>
                    <span className="font-black text-white">{postCount}</span> <span className="text-white/40">Posts</span>
                  </div>
                  <span className="text-white/10 font-thin">|</span>
                  <div>
                    <span className="font-black text-white">{followerCount}</span> <span className="text-white/40">Followers</span>
                  </div>
                  <span className="text-white/10 font-thin">|</span>
                  <div>
                    <span className="font-black text-white">{followingCount}</span> <span className="text-white/40">Following</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right flex end for Action Buttons */}
            <div className="flex items-center gap-3 w-full md:w-auto justify-start md:justify-end mt-2 md:mt-0">
              <a
                href={creator.instagram_url || `https://instagram.com/${creator.handle?.replace('@', '') || creator.subdomain}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 md:flex-initial px-5 py-2.5 bg-white text-zinc-950 font-bold text-xs rounded-full shadow-lg hover:bg-white/90 active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 select-none"
              >
                <InstagramIcon className="w-3.5 h-3.5 text-zinc-950" />
                <span>Follow</span>
              </a>
              <a
                href={`/${creator.subdomain}`}
                className="flex-1 md:flex-initial px-5 py-2.5 bg-zinc-900/60 border border-white/10 hover:border-white/25 text-white text-xs font-mono rounded-full font-bold tracking-wide transition-all duration-300 flex items-center justify-center gap-2 backdrop-blur-md select-none"
              >
                <Globe className="w-3.5 h-3.5 text-blue-400" />
                <span>Profile</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Premium Hero Ad Slot */}
      {adHero && (
        <div className="max-w-4xl mx-auto px-6 mb-8 animate-in fade-in duration-700">
          {adHero}
        </div>
      )}

      {/* Main Glassmorphic Wrapper */}
      <div className="max-w-4xl mx-auto px-6 pt-0 animate-in fade-in duration-500">
        <div className="w-full bg-zinc-900/40 backdrop-blur-md rounded-2xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] overflow-hidden border border-white/5">

          {/* Tabs Switcher */}
          <div className="flex border-b border-white/5 bg-zinc-900/40 sticky top-0 z-20 backdrop-blur-md select-none">
            <button
              onClick={() => setActiveTab('prompt')}
              className={`flex-1 flex items-center justify-center gap-2 py-4 text-xs md:text-sm font-bold transition-all border-b-2 ${activeTab === 'prompt'
                ? 'border-blue-500 text-white'
                : 'border-transparent text-zinc-500 hover:text-zinc-400'
                }`}
            >
              <LayoutGrid className="w-4 h-4" />
              Prompt Detail
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex-1 flex items-center justify-center gap-2 py-4 text-xs md:text-sm font-bold transition-all border-b-2 ${activeTab === 'profile'
                ? 'border-blue-500 text-white'
                : 'border-transparent text-zinc-500 hover:text-zinc-400'
                }`}
            >
              <LayoutGrid className="w-4 h-4" />
              Prompt Library
            </button>
          </div>

          {/* Tab Content */}
          <div className="relative select-none">
            {activeTab === 'prompt' ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 transition-opacity">
                <div className="px-4 py-8 md:px-8 text-white">
                  {/* Media Section — clean inline video/image, no social chrome */}
                  {(() => {
                    const mediaUrl = igMedia?.media_url || prompt.video_url || null
                    const isVideo = igMedia?.media_type === 'VIDEO' || (mediaUrl && !igMedia && /\.(mp4|mov|webm)/i.test(mediaUrl))
                    const thumbUrl = igMedia?.thumbnail_url || prompt.thumbnail_url || null

                    if (!mediaUrl && !thumbUrl) return null

                    return (
                      <div className="mb-8 animate-in fade-in duration-700 w-full rounded-2xl overflow-hidden border border-white/10 bg-zinc-900/40">
                        {isVideo && mediaUrl ? (
                          <video
                            src={mediaUrl}
                            poster={thumbUrl ?? undefined}
                            controls
                            playsInline
                            className="w-full max-h-[520px] object-contain bg-black"
                          />
                        ) : (
                          <img
                            src={mediaUrl || thumbUrl!}
                            alt={prompt.title}
                            className="w-full max-h-[520px] object-contain bg-black"
                          />
                        )}
                      </div>
                    )
                  })()}

                  {adAbovePrompt && <div className="mb-6">{adAbovePrompt}</div>}

                  <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white mb-4 leading-tight">
                    {prompt.title}
                  </h1>
                  <div className="flex flex-wrap gap-2 mb-6">
                    <span
                      className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider px-3 py-1.5 rounded-full border bg-zinc-900/60 border-white/10 text-white/90 backdrop-blur-md"
                    >
                      <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: toolColor }} />
                      AI Tool: {prompt.ai_tool}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-mono tracking-wider px-3 py-1.5 rounded-full border bg-zinc-900/60 border-white/10 text-white/70">
                      Output: {prompt.output_type}
                    </span>
                  </div>
                  {prompt.description && (
                    <p className="text-zinc-400 text-sm md:text-base leading-relaxed mb-8 font-light whitespace-pre-line">{prompt.description}</p>
                  )}

                  {/* Gate component with premium dynamic forms */}
                  <PromptGate prompt={prompt} key={prompt.id} />

                  {adBelowPrompt && <div className="mt-8">{adBelowPrompt}</div>}
                </div>

                {adPopupPlacements && adPopupPlacements.length > 0 && (
                  <AdPopup placements={adPopupPlacements} promptId={prompt.id} creatorId={creator.id} />
                )}

                {/* Related Prompts Section */}
                <div className="px-4 md:px-8 pb-12 bg-zinc-950/40 pt-8 border-t border-white/5">
                  <div className="w-full">
                    {relatedData && relatedData.length > 0 && (
                      <RelatedPrompts
                        prompts={finalRelatedData}
                        subdomain={creator.subdomain}
                        onPromptClick={handlePromptClick}
                      />
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 bg-zinc-950 min-h-[400px] p-4 sm:p-6 space-y-6 sm:space-y-8 select-none">
                {/* Categories Pills & Grid/List Layout Toggle */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 w-full select-none">
                  {activeCategoryIds.length > 0 ? (
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-1.5 flex-1 w-full">
                      <button
                        onClick={() => setActiveCategory(null)}
                        className={`px-5 py-2.5 rounded-xl text-xs font-mono tracking-wider transition-all duration-300 border ${activeCategory === null
                          ? 'bg-blue-600/10 border-blue-500/50 text-blue-400 font-bold shadow-lg shadow-blue-500/5'
                          : 'bg-zinc-900/40 border-white/5 text-white/40 hover:text-white hover:border-white/15'
                          }`}
                      >
                        All ({libraryPrompts.length})
                      </button>
                      {activeCategoryIds.map(cat => {
                        const count = libraryPrompts.filter(p => p.category_id === cat.id).length
                        const isActive = activeCategory === cat.id
                        return (
                          <button
                            key={cat.id}
                            onClick={() => setActiveCategory(isActive ? null : cat.id)}
                            className={`px-5 py-2.5 rounded-xl text-xs font-mono tracking-wider transition-all duration-300 border ${isActive
                              ? 'bg-blue-600/10 border-blue-500/50 text-blue-400 font-bold shadow-lg shadow-blue-500/5'
                              : 'bg-zinc-900/40 border-white/5 text-white/40 hover:text-white hover:border-white/15'
                              }`}
                          >
                            {cat.icon && <span className="mr-1.5">{cat.icon}</span>}
                            {cat.name} ({count})
                          </button>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="flex-1" />
                  )}

                  {/* Grid / List Layout Switcher */}
                  <div className="p-1 bg-zinc-900/60 border border-white/10 rounded-2xl flex items-center gap-1 shadow-2xl shrink-0 backdrop-blur-xl">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold font-mono tracking-wider transition-all flex items-center gap-1.5 ${viewMode === 'grid'
                        ? 'bg-white text-zinc-950 shadow-md font-black'
                        : 'text-zinc-400 hover:text-white'
                        }`}
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                      <span>Grid</span>
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold font-mono tracking-wider transition-all flex items-center gap-1.5 ${viewMode === 'list'
                        ? 'bg-white text-zinc-950 shadow-md font-black'
                        : 'text-zinc-400 hover:text-white'
                        }`}
                    >
                      <List className="w-3.5 h-3.5" />
                      <span>List</span>
                    </button>
                  </div>
                </div>

                {/* Prompt Cards Grid */}
                {filteredLibraryPrompts.length === 0 ? (
                  <div className="py-24 text-center text-zinc-600">
                    <Grid3x3 className="w-10 h-10 mx-auto mb-4 opacity-30" />
                    <p className="text-sm">No prompts in this category yet.</p>
                  </div>
                ) : (
                  <div
                    className={viewMode === 'grid'
                      ? "grid grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500"
                      : "flex flex-col gap-4 max-w-2xl mx-auto w-full animate-in fade-in duration-500"
                    }
                  >
                    {filteredLibraryPrompts.map(p => {
                      const toolColor = AI_TOOL_COLORS[p.ai_tool.split(',')[0].trim()] ?? '#6366f1'
                      const gate = GATE_LABELS[p.gate_type] ?? GATE_LABELS.open

                      if (viewMode === 'list') {
                        return (
                          <div
                            onClick={() => handleLibraryPromptClick(p)}
                            key={p.id}
                            className="group w-full rounded-2xl overflow-hidden border border-white/10 hover:border-white/20 transition-all duration-300 cursor-pointer select-none flex items-center justify-between p-3 sm:p-4 bg-zinc-900/30 backdrop-blur-xl hover:scale-[1.01] shadow-2xl gap-4 animate-in fade-in duration-300"
                          >
                            {/* Horizontal Row Left Side */}
                            <div className="flex items-center gap-4 min-w-0 flex-1">
                              {/* Horizontal Thumbnail Container */}
                              <div className="relative w-16 h-20 sm:w-20 sm:h-24 rounded-xl overflow-hidden border border-white/10 flex-shrink-0 z-0 select-none bg-zinc-950">
                                {p.thumbnail_url ? (
                                  <img
                                    src={p.thumbnail_url}
                                    alt={p.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700 opacity-70 group-hover:opacity-90"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center opacity-40">
                                    <Sparkles className="w-6 h-6 text-white/20" />
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/60 via-transparent to-transparent z-10" />
                              </div>

                              {/* Info */}
                              <div className="flex-1 min-w-0 space-y-1 sm:space-y-2 text-left">
                                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                  <span className="inline-flex items-center gap-1 text-[8px] sm:text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 sm:py-1 rounded-md border bg-zinc-900/75 border-white/10 text-white/95">
                                    <span className="w-1 h-1 rounded-full animate-pulse" style={{ background: toolColor }} />
                                    {p.ai_tool?.split(',')[0].trim()}
                                  </span>
                                  {p.content_type === 'pdf' && (
                                    <span className="text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 bg-pink-600/20 text-pink-300 border border-pink-500/30 rounded-md font-mono uppercase tracking-wide">PDF</span>
                                  )}
                                  <span className="text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded-md font-mono uppercase tracking-wide" style={{ background: `${gate.color}22`, color: gate.color, border: `1px solid ${gate.color}44` }}>{gate.label}</span>
                                </div>

                                <h3 className="text-sm sm:text-lg font-bold tracking-tight text-white/95 leading-snug line-clamp-1 sm:line-clamp-2 select-none group-hover:text-blue-400 transition-colors">
                                  {p.title}
                                </h3>

                                <div className="flex items-center gap-2">
                                  <span className="inline-flex items-center gap-1 text-[8px] sm:text-[9px] text-zinc-500 px-1.5 py-0.5 rounded-md bg-zinc-800/80 border border-zinc-700/60 font-mono">
                                    {OUTPUT_ICONS[p.output_type] || <FileText className="w-3 h-3" />}
                                    {p.output_type}
                                  </span>
                                  {p.description && (
                                    <span className="text-[10px] text-zinc-500 truncate hidden sm:inline-block max-w-md font-light">
                                      — {p.description}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Action Button Right Side */}
                            <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl bg-white text-zinc-950 font-sans font-bold text-xs shadow-lg group-hover:scale-105 transition-all duration-300 hover:bg-white/90 flex-shrink-0 select-none">
                              <ChevronRight className="w-4 h-4 text-zinc-950" />
                            </div>
                          </div>
                        )
                      }

                      return (
                        <div
                          onClick={() => handleLibraryPromptClick(p)}
                          key={p.id}
                          className="group relative h-[320px] sm:h-[440px] rounded-[32px] sm:rounded-[36px] lg:rounded-2xl overflow-hidden border border-white/10 hover:border-white/20 transition-all duration-500 cursor-pointer select-none flex flex-col justify-between p-4 sm:p-7 bg-zinc-900/30 backdrop-blur-xl hover:scale-[1.02] shadow-2xl"
                        >
                          {/* Background immersive image with darker glass overlay */}
                          <div className="absolute inset-0 z-0 select-none">
                            {p.thumbnail_url ? (
                              <img
                                src={p.thumbnail_url}
                                alt={p.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700 opacity-55 group-hover:opacity-70"
                              />
                            ) : (
                              <div className="w-full h-full bg-zinc-950 flex items-center justify-center opacity-40">
                                <Sparkles className="w-10 h-10 text-white/20" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/45 to-transparent z-10" />
                          </div>

                          {/* Badges on top */}
                          <div className="relative z-10 flex justify-between items-start">
                            <span
                              className="inline-flex items-center gap-1 text-[8px] sm:text-[10px] font-mono uppercase tracking-widest px-2 py-1 sm:px-3 sm:py-1.5 rounded-full border bg-zinc-900/70 border-white/10 text-white/90 backdrop-blur-md"
                            >
                              <span className="w-1 h-1 rounded-full animate-pulse" style={{ background: toolColor }} />
                              <span className="sm:hidden">{p.ai_tool?.split(',')[0].trim()}</span>
                              <span className="hidden sm:inline">{p.ai_tool?.split(',')[0].trim()}</span>
                            </span>

                            <div className="flex gap-1 sm:gap-2">
                              {p.content_type === 'pdf' && (
                                <span className="text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 sm:px-2 sm:py-1 bg-pink-600/20 text-pink-300 border border-pink-500/30 rounded-full font-mono uppercase tracking-wide">
                                  PDF
                                </span>
                              )}
                              <span
                                className="text-[8px] sm:text-[9px] font-bold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full font-mono uppercase tracking-wide"
                                style={{ background: `${gate.color}22`, color: gate.color, border: `1px solid ${gate.color}44` }}
                              >
                                {gate.label}
                              </span>
                            </div>
                          </div>

                          {/* Content text grouped at bottom */}
                          <div className="relative z-10 flex flex-col justify-end h-full w-full space-y-2 sm:space-y-4">
                            <div className="space-y-1 sm:space-y-2 select-none">
                              <h3 className="text-base sm:text-2xl font-bold tracking-tight text-white/95 leading-tight select-none line-clamp-2">
                                {p.title}
                              </h3>
                              {/* {p.description && (
                                <p className="text-[10px] sm:text-xs text-white/45 leading-relaxed line-clamp-2 font-light hidden sm:block">
                                  {p.description}
                                </p>
                              )} */}
                            </div>

                            {/* Card footer */}
                            <div className="w-full flex items-center justify-between border-t border-white/10 pt-2 sm:pt-4 select-none">
                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1 text-[8px] sm:text-[10px] text-zinc-500 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-zinc-800/80 border border-zinc-700/60 font-mono">
                                  {OUTPUT_ICONS[p.output_type] || <FileText className="w-3.5 h-3.5" />}
                                  {p.output_type}
                                </span>
                              </div>

                              <div className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center rounded-full bg-white text-zinc-950 font-sans font-bold text-xs shadow-lg group-hover:scale-105 transition-all duration-500 hover:bg-white/90 shrink-0 select-none">
                                <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-950" />
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {showDebug && (
        <div className="fixed bottom-0 left-0 right-0 bg-black/90 border-t border-red-500/50 p-6 z-[9999] text-[10px] font-mono overflow-auto max-h-[40vh] shadow-2xl backdrop-blur-md">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-red-400 font-bold text-xs uppercase tracking-widest">Debug Console</h3>
            <button onClick={() => setShowDebug(false)} className="text-zinc-500 hover:text-white">Close</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-zinc-500 mb-1 border-b border-zinc-800 pb-1">Prompt Metadata</p>
              <pre className="text-zinc-300">
                {JSON.stringify({
                  id: prompt.id,
                  title: prompt.title,
                  gate_type: prompt.gate_type,
                  has_content: !!prompt.content,
                  content_type: prompt.content_type,
                  video_url: prompt.video_url,
                  thumbnail_url: prompt.thumbnail_url
                }, null, 2)}
              </pre>
            </div>
            <div>
              <p className="text-zinc-500 mb-1 border-b border-zinc-800 pb-1">Render Context</p>
              <pre className="text-zinc-300">
                {JSON.stringify({
                  activeTab,
                  hasIgUser: !!igUser,
                  hasIgMedia: !!igMedia,
                  hasOEmbed: !!oEmbedHtml
                }, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
      {/* Mini Footer for Trust & Compliance (Helps with TikTok/FB In-App Browsers) */}
      <footer className="mt-12 mb-8 px-6 text-center animate-in fade-in slide-in-from-bottom-2 duration-1000 delay-500">
        <div className="flex items-center justify-center gap-6 text-[10px] font-mono tracking-widest text-white/20 uppercase">
          <Link href="/privacy-policy" className="hover:text-white/40 transition-colors">Privacy</Link>
          <span className="w-1 h-1 rounded-full bg-white/10" />
          <Link href="/terms" className="hover:text-white/40 transition-colors">Terms</Link>
          <span className="w-1 h-1 rounded-full bg-white/10" />
          <Link href="/" className="hover:text-white/40 transition-colors">© Creatopedia</Link>
        </div>
      </footer>
    </div>
  )
}
