/* eslint-disable react-hooks/static-components */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, Globe, Filter, ArrowRight } from 'lucide-react'
import AdBanner from '@/components/public/AdBanner'

export default function PlatformsSection() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')

  const [categories, setCategories] = useState<string[]>([
    'All',
    'Midjourney',
    'ChatGPT',
    'Claude',
    'Code Generation',
    'Social & Marketing',
  ])

  const [creators, setCreators] = useState<any[]>([])
  const [prompts, setPrompts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [adPlacements, setAdPlacements] = useState<any[]>([])

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/platforms')
        if (res.ok) {
          const data = await res.json()

          // Creators
          if (data.creators && data.creators.length > 0) {
            setCreators(data.creators)
          } else {
            // Fallbacks if database has no data yet
            setCreators([
              {
                name: 'Aasma Shrestha',
                subdomain: 'aasma_visuals',
                handle: '@aasma_visuals',
                metrics: '120k+ impressions',
                avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
                bio: 'AI content creator & digital artist.'
              },
              {
                name: 'Milan Ray',
                subdomain: 'milan',
                handle: '@milanray.design',
                metrics: '45k+ reach',
                avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
                bio: 'AI content creator & prompt engineer. Turning ideas into visuals.'
              }
            ])
          }

          // Dynamic Categories from fetched categories list
          if (data.categories && data.categories.length > 0) {
            const dynamicCats = ['All', ...data.categories.map((c: any) => c.name)]
            setCategories(dynamicCats)
          }

          // Prompts
          if (data.prompts && data.prompts.length > 0) {
            setPrompts(data.prompts)
          } else {
            // Seeding/Fallback prompts
            setPrompts([
              {
                title: 'Midjourney Cinematic Prompts v6',
                description: 'Exclusive high-converting hyper-realistic lighting & photography prompts.',
                ai_tool: 'Midjourney',
                gate_type: 'open',
                price: '$0',
                slug: 'cinematic-photo-enhance',
                featured: true,
                subdomain: 'milan',
                image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=500&q=80',
              },
              {
                title: 'Advanced Claude Workflows',
                description: 'Tested multi-prompt architectures for comprehensive business automation.',
                ai_tool: 'Claude',
                gate_type: 'email',
                price: '$0',
                slug: 'viral-reel-script',
                featured: true,
                subdomain: 'milan',
                image: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&w=500&q=80',
              },
              {
                title: 'The Ultimate GPT Growth Kit',
                description: 'Marketing templates & direct programmatic prompt sequences.',
                ai_tool: 'ChatGPT',
                gate_type: 'email',
                price: '$0',
                slug: 'brand-logo',
                featured: true,
                subdomain: 'milan',
                image: 'https://images.unsplash.com/photo-1639322537228-f710d846310a?auto=format&fit=crop&w=500&q=80',
              }
            ])
          }
        }

        // Fetch marketplace ads
        const adsRes = await fetch('/api/ads?position=marketplace')
        if (adsRes.ok) {
          const adsData = await adsRes.json()
          setAdPlacements(adsData || [])
        }
      } catch (err) {
        console.error('Failed to load platforms dynamic data', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const filteredCreators = creators.filter((creator) => {
    const nameStr = creator.name || ''
    const bioStr = creator.bio || ''
    const handleStr = creator.handle || ''

    const matchesSearch =
      nameStr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bioStr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      handleStr.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory =
      selectedCategory === 'All' || bioStr.toLowerCase().includes(selectedCategory.toLowerCase())

    return matchesSearch && matchesCategory
  })

  const filteredProducts = prompts.filter((p) => {
    const titleStr = p.title || ''
    const descStr = p.description || ''
    const toolStr = p.ai_tool || ''

    const matchesSearch =
      titleStr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      descStr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      toolStr.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory =
      selectedCategory === 'All' || toolStr === selectedCategory

    return matchesSearch && matchesCategory
  })

  // Loading Shimmer Grids
  const ShimmerGrid = () => (
    <div className="grid grid-cols-3 gap-3 md:gap-8">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="group relative h-[280px] sm:h-[480px] rounded-[24px] sm:rounded-[40px] overflow-hidden border border-white/5 bg-zinc-900/10 backdrop-blur-md p-3 sm:p-8 select-none flex flex-col justify-end space-y-3 sm:space-y-5 animate-pulse">
          <div className="space-y-3">
            <div className="h-4 sm:h-8 bg-white/5 rounded-xl w-3/4" />
            <div className="h-2 sm:h-4 bg-white/5 rounded-xl w-1/3" />
          </div>
          <div className="pt-2 sm:pt-4 border-t border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-1 sm:gap-3">
              <div className="w-5 h-5 sm:w-9 sm:h-9 rounded-full bg-white/5" />
              <div className="space-y-1 sm:space-y-2">
                <div className="h-2 bg-white/5 rounded w-10 sm:w-16" />
                <div className="h-1.5 bg-white/5 rounded w-6 sm:w-10" />
              </div>
            </div>
            <div className="w-12 h-6 sm:w-24 sm:h-9 bg-white/5 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  )

  const CreatorsShimmerGrid = () => (
    <div className="grid grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="group relative h-[280px] sm:h-[480px] rounded-[24px] sm:rounded-[40px] overflow-hidden border border-white/5 bg-zinc-900/10 backdrop-blur-md p-3 sm:p-8 select-none flex flex-col justify-end space-y-3 sm:space-y-5 animate-pulse">
          <div className="space-y-3">
            <div className="w-8 h-4 sm:w-16 sm:h-6 bg-white/5 rounded-full" />
            <div className="h-4 sm:h-8 bg-white/5 rounded-xl w-3/4" />
            <div className="h-2 sm:h-4 bg-white/5 rounded-xl w-1/2" />
          </div>
          <div className="pt-2 sm:pt-4 border-t border-white/5 flex items-center justify-between">
            <div className="h-2 sm:h-4 bg-white/5 rounded-xl w-1/3" />
            <div className="w-2 h-2 sm:w-4 sm:h-4 rounded-full bg-white/5" />
          </div>
        </div>
      ))}
    </div>
  )


  return (
    <section className="bg-transparent select-none relative overflow-hidden flex flex-col font-sans">
      {/* ── TOP HERO VIDEO SECTION (90% SCREEN HEIGHT) ── */}
      <div className="relative h-[90vh] flex flex-col justify-center items-center text-center overflow-hidden px-6">
        {/* Background Video */}
        <div className="absolute inset-0 z-0">
          <video
            src="/videos/storytelling.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover select-none"
          />
          {/* Glass Overlay to darken video & match exactly as in the reference screenshot */}
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/65 to-zinc-950/70 backdrop-blur-[1px] z-10" />
        </div>

        {/* Center Text Over Video */}
        <div className="relative z-20 space-y-6 max-w-4xl flex flex-col items-center animate-in fade-in duration-1000">
          {/* Pill Tag */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900/70 border border-white/10 text-white/70 text-[10px] font-mono uppercase tracking-[0.22em] backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            WHAT WE DO
          </div>

          <h2 className="text-5xl sm:text-7xl md:text-[88px] font-black tracking-tight leading-[1.05]">
            <span className="text-white block">Find what you</span>
            <span
              className="block mt-2"
              style={{
                background: 'linear-gradient(90deg, #3b82f6 0%, #a855f7 35%, #ec4899 70%, #ef4444 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              exactly need.
            </span>
          </h2>

          <p className="text-sm md:text-base text-white/60 leading-relaxed font-light max-w-xl mx-auto">
            A comprehensive marketplace of curated prompt templates, bespoke digital assets, and high impact resources. Direct access to elite global creators.
          </p>
        </div>
      </div>

      {/* ── SCROLLABLE MARKETPLACE (BELOW 90% HERO) ── */}
      <div className="relative z-30 max-w-7xl mx-auto px-6 py-24 w-full space-y-24 bg-zinc-950">
        {/* ── LIST TOP 3 VIRAL WITH IMAGE ── */}
        <div className="space-y-12">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-900/60 backdrop-blur-md border border-white/10 text-pink-500 text-[10px] font-mono uppercase tracking-[0.2em]">
              <span>🔥</span> Trending & Viral
            </div>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white leading-tight">
              Top 3 <span className="italic font-light text-white/80">Viral Materials</span>
            </h2>
          </div>

          {loading ? (
            // eslint-disable-next-line react-hooks/static-components
            <ShimmerGrid />
          ) : (
            <div className="grid grid-cols-3 gap-3 md:gap-8">
              {prompts.slice(0, 3).map((item, i) => {
                const creativeSub = item.subdomain || creators.find(c => c.id === item.creator_id)?.subdomain || 'milan'
                const creator = creators.find(c => c.id === item.creator_id)
                return (
                  <Link
                    href={`/${creativeSub}/${item.slug}`}
                    key={i}
                    className="group relative h-[280px] sm:h-[480px] rounded-md sm:rounded-[40px] overflow-hidden border border-white/10 hover:border-white/20 transition-all duration-500 cursor-pointer select-none flex flex-col justify-between p-3 sm:p-8 bg-zinc-900/30 backdrop-blur-xl hover:scale-[1.02] shadow-2xl"
                  >
                    {/* Background immersive image with darker glass overlay */}
                    <div className="absolute inset-0 z-0 select-none">
                      <img
                        src={item.ig_thumbnail_url || item.thumbnail_url || item.image || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=500&q=80'}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700 opacity-55 group-hover:opacity-70"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/45 to-transparent z-10" />
                    </div>

                    {/* Title directly above the profile section at the bottom */}
                    <div className="relative z-10 flex flex-col justify-end h-full w-full space-y-2 sm:space-y-5">
                      <div className="space-y-1 select-none">
                        <h3 className="text-xs sm:text-lg md:text-2xl font-bold tracking-tight text-white/95 leading-tight select-none line-clamp-2">
                          {item.title}
                        </h3>
                      </div>

                      {/* Dynamic Bottom Row from screenshot reference */}
                      <div className="w-full flex items-center justify-between border-t border-white/10 pt-2 sm:pt-4 select-none">
                        <div className="flex items-center gap-1 sm:gap-3">
                          <img
                            src={creator?.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80'}
                            alt={creator?.name || 'Creator'}
                            className="w-5 h-5 sm:w-9 sm:h-9 rounded-md sm:rounded-full object-cover border border-white/15 flex-shrink-0"
                          />
                          <div className="flex flex-col text-left font-mono">
                            <span className="text-[8px] sm:text-xs text-white/90 font-bold leading-none select-none tracking-tight line-clamp-1">
                              {creator?.handle || '@milanray.design'}
                            </span>
                            <span className="text-[6px] sm:text-[8px] text-white/40 mt-1 leading-none font-light tracking-wide hidden sm:block">
                              Just published
                            </span>
                          </div>
                        </div>

                        {/* White Rounded CTA Button from screenshot */}
                        <div className="px-2 py-1 sm:px-5 sm:py-3 bg-white text-zinc-950 font-sans font-bold text-[8px] sm:text-xs rounded-md sm:rounded-full shadow-lg group-hover:scale-[1.03] transition-all duration-500 hover:bg-white/90 flex items-center gap-1 select-none flex-shrink-0">
                          <span className="hidden sm:inline">+</span>
                          <span className="sm:hidden">→</span>
                          <span className="hidden sm:inline">More Info</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* ── LIST CREATORS & CATEGORIES MARKETPLACE ── */}
        <div className="space-y-16">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-4 max-w-lg">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-md sm:rounded-full bg-zinc-900/60 backdrop-blur-md border border-white/10 text-blue-400 text-[10px] font-mono uppercase tracking-[0.2em]">
                <span>🔍</span> Marketplace
              </div>
              <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white leading-tight">
                Explore <span className="italic font-light text-white/80">Creators & Items</span>
              </h2>
            </div>
            <div className="relative flex-grow max-w-md w-full">
              <Search className="w-4 h-4 text-white/30 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search top creators or categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-900/50 border border-white/10 hover:border-white/20 focus:border-blue-500/50 focus:outline-none p-4 pl-12 text-sm text-white transition-all rounded-xl sm:rounded-2xl tracking-wide placeholder-white/30"
              />
            </div>
          </div>

          {/* Categories Tab Bar */}
          <div className="flex flex-wrap items-center gap-2 select-none animate-in fade-in duration-500">
            <Filter className="w-4 h-4 text-white/40 mr-2 hidden sm:block" />
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-5 py-3 rounded-md sm:rounded-2xl text-xs font-mono tracking-wider transition-all duration-300 border ${isSelected
                    ? 'bg-blue-600/10 border-blue-500/50 text-blue-400 font-bold'
                    : 'bg-zinc-900/40 border-white/5 text-white/40 hover:text-white hover:border-white/15'
                    }`}
                >
                  {cat}
                </button>
              )
            })}
          </div>

          {/* Creators Listing Grid */}
          {loading ? (
            // eslint-disable-next-line react-hooks/static-components
            <CreatorsShimmerGrid />
          ) : (
            <div className="grid grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6 animate-in fade-in duration-1000">
              {filteredCreators.map((creator, i) => {
                const creativeSubdomain = creator.subdomain || creator.handle?.replace('@', '') || 'milan'
                return (
                  <Link
                    href={`/${creativeSubdomain}`}
                    key={i}
                    className="group relative h-[280px] sm:h-[480px] rounded-md sm:rounded-[40px] overflow-hidden border border-white/10 hover:border-white/20 transition-all duration-500 cursor-pointer select-none flex flex-col justify-between p-3 sm:p-8 bg-zinc-900/30 backdrop-blur-xl hover:scale-[1.02] shadow-2xl"
                  >
                    {/* Background immersive image with darker glass overlay */}
                    <div className="absolute inset-0 z-0 select-none">
                      <img
                        src={creator.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80'}
                        alt={creator.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700 opacity-55 group-hover:opacity-70"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/45 to-transparent z-10" />
                    </div>

                    {/* Dynamic content grouped above profile section at bottom */}
                    <div className="relative z-10 flex flex-col justify-end h-full w-full space-y-2 sm:space-y-5">
                      <div className="space-y-1 select-none">
                        <span className="font-mono text-[6px] sm:text-[9px] text-blue-400 border border-blue-500/20 bg-blue-500/10 px-1 py-0.5 sm:px-3 sm:py-1 rounded-md sm:rounded-full tracking-widest uppercase font-bold w-max block">
                          Creator
                        </span>
                        <h3 className="text-xs sm:text-lg md:text-2xl font-bold tracking-tight text-white/95 leading-tight select-none line-clamp-1 sm:line-clamp-2">
                          {creator.name}
                        </h3>
                        <p className="text-[7px] sm:text-xs text-white/50 font-mono tracking-wide font-light line-clamp-1">
                          {creator.handle}
                        </p>
                      </div>

                      <div className="pt-2 sm:pt-4 border-t border-white/10 flex items-center justify-between text-[7px] sm:text-[11px] font-mono text-white/35 group-hover:text-blue-400 transition-colors uppercase tracking-widest select-none">
                        <span className="line-clamp-1">View Profile</span>
                        <Globe className="w-3 h-3 sm:w-4 sm:h-4 text-white/30 group-hover:text-blue-500 transition-colors flex-shrink-0" />
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
          {!loading && filteredCreators.length === 0 && (
            <div className="text-center text-white/40 py-12 font-mono text-sm">
              No creators match your current search query.
            </div>
          )}
        </div>

        {/* ── FEATURED DIGITAL PRODUCTS GRID ── */}
        <div className="space-y-12 pt-16 border-t border-white/5">
          <div className="space-y-4 max-xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-md sm:rounded-full bg-zinc-900/60 backdrop-blur-md border border-white/10 text-indigo-400 text-[10px] font-mono uppercase tracking-[0.2em]">
              <span>✦</span> Digital Marketplace
            </div>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white leading-tight">
              Premium <span className="italic font-light text-white/80">Digital Products</span>
            </h2>
          </div>

          {loading ? (
            <ShimmerGrid />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 animate-in fade-in duration-1000">
              {(() => {
                const items = []
                const frequency = 4 // Marketplace default
                const hasAd = adPlacements.length > 0
                
                for (let i = 0; i < filteredProducts.length; i++) {
                  const prod = filteredProducts[i]
                  const creativeSub = prod.subdomain || creators.find((c: any) => c.id === prod.creator_id)?.subdomain || 'milan'
                  const creator = creators.find((c: any) => c.id === prod.creator_id)

                  items.push(
                    <Link
                      href={`/${creativeSub}/${prod.slug}`}
                      key={prod.id || i}
                      className="group relative h-[280px] sm:h-[480px] rounded-md sm:rounded-[40px] overflow-hidden border border-white/10 hover:border-white/20 transition-all duration-500 cursor-pointer select-none flex flex-col justify-between p-3 sm:p-8 bg-zinc-900/30 backdrop-blur-xl hover:scale-[1.02] shadow-2xl"
                    >
                      {/* Background immersive image with darker glass overlay */}
                      <div className="absolute inset-0 z-0 select-none">
                        <img
                          src={prod.ig_thumbnail_url || prod.thumbnail_url || prod.image || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=500&q=80'}
                          alt={prod.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700 opacity-55 group-hover:opacity-70"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/45 to-transparent z-10" />
                      </div>

                      {/* Title directly above the profile section at the bottom */}
                      <div className="relative z-10 flex flex-col justify-end h-full w-full space-y-2 sm:space-y-5">
                        <div className="space-y-1 select-none">
                          <h3 className="text-xs sm:text-lg md:text-2xl font-bold tracking-tight text-white/95 leading-tight select-none line-clamp-1 sm:line-clamp-2">
                            {prod.title}
                          </h3>
                          <div className="inline-flex items-center gap-1.5 text-white/60 font-mono text-[8px] sm:text-[10px] uppercase tracking-wider font-light">
                            <span className="w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full bg-pink-500/80 animate-pulse" />
                            <span>Connecting</span>
                          </div>
                        </div>

                        {/* Dynamic Bottom Row from screenshot reference */}
                        <div className="w-full flex items-center justify-between border-t border-white/10 pt-2 sm:pt-4 select-none">
                          <div className="flex items-center gap-1 sm:gap-3">
                            <img
                              src={creator?.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80'}
                              alt={creator?.name || 'Creator'}
                              className="w-5 h-5 sm:w-9 sm:h-9 rounded-md sm:rounded-full object-cover border border-white/15 flex-shrink-0"
                            />
                            <div className="flex flex-col text-left font-mono">
                              <span className="text-[8px] sm:text-xs text-white/90 font-bold leading-none select-none tracking-tight line-clamp-1">
                                {creator?.handle || '@milanray.design'}
                              </span>
                              <span className="text-[6px] sm:text-[10px] text-white/40 mt-1 leading-none font-light tracking-wide hidden sm:block">
                                Available now
                              </span>
                            </div>
                          </div>

                          {/* White Rounded CTA Button from screenshot */}
                          <div className="px-2 py-1 sm:px-5 sm:py-3 bg-white text-zinc-950 font-sans font-bold text-xs rounded-md sm:rounded-full shadow-lg group-hover:scale-[1.03] transition-all duration-500 hover:bg-white/90 flex items-center gap-1 select-none flex-shrink-0">
                            <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 text-zinc-950" />
                          </div>
                        </div>
                      </div>
                    </Link>
                  )

                  if (hasAd && (i + 1) % frequency === 0 && i !== filteredProducts.length - 1) {
                    items.push(
                      <div key={`ad-${i}`} className="relative h-[280px] sm:h-[480px] rounded-md sm:rounded-[40px] overflow-hidden border border-dashed border-white/10 bg-zinc-900/10 flex items-center justify-center p-2">
                        <AdBanner 
                          placements={adPlacements} 
                          position="marketplace" 
                        />
                      </div>
                    )
                  }
                }
                return items
              })()}
            </div>
          )}
          {!loading && filteredProducts.length === 0 && (
            <div className="text-center text-white/40 py-12 font-mono text-sm">
              No products match your current search query.
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
