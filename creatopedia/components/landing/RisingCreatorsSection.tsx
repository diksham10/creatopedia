'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'

interface APICreator {
  name: string
  bio?: string
  handle?: string
  subdomain?: string
  metrics?: string
  avatar_url?: string
}

interface RisingCreator {
  name: string
  niche: string
  handle: string
  metrics: string
  image: string
}

export default function RisingCreatorsSection() {
  const [activeCreator, setActiveCreator] = useState(0)
  const { data: creatorsData } = useQuery<APICreator[]>({
    queryKey: ['rising-creators'],
    queryFn: async () => {
      const res = await fetch('/api/platforms')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      return data.creators || []
    },
    staleTime: 24 * 60 * 60 * 1000,
  })

  const risingCreators = React.useMemo<RisingCreator[]>(() => {
    if (creatorsData && Array.isArray(creatorsData) && creatorsData.length > 0) {
      return creatorsData.slice(0, 4).map((c) => ({
        name: c.name,
        niche: c.bio || 'Prompts Creator',
        handle: c.handle || `@${c.subdomain}`,
        metrics: c.metrics || '100k+ impressions',
        image: c.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80'
      }))
    }
    // Fallback hardcoded creators
    return [
      { name: 'Aasma Shrestha', niche: 'Midjourney Artist', handle: '@aasma_visuals', metrics: '120k+ impressions', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80' },
      { name: 'Milan Ray', niche: 'Claude Workflows', handle: '@milan_designs', metrics: '45k+ direct reach', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80' },
      { name: 'David Cern', niche: 'ChatGPT Prompts', handle: '@david_cosmos', metrics: '80k+ direct reads', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80' },
      { name: 'Sarah Kim', niche: 'Stable Diffusion', handle: '@sarah_arts', metrics: '150k+ clicks', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80' },
    ]
  }, [creatorsData])

  return (
    <section id="rising-creators" className="py-36 px-6 bg-transparent select-none relative overflow-hidden group">
      <div
        className="absolute inset-0 z-0 pointer-events-none opacity-40 group-hover:opacity-55 transition-opacity duration-700"
        style={{
          background: [
            'radial-gradient(ellipse 75% 60% at 90% 10%, rgba(28,55,170,0.40) 0%, transparent 60%)',
            'radial-gradient(ellipse 65% 50% at 10% 90%, rgba(155,15,50,0.35) 0%, transparent 60%)',
          ].join(', ')
        }}
      />

      <div className="max-w-7xl mx-auto space-y-20 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#111520]/80 border border-white/10 text-[#ff1f4b] text-[10px] font-mono uppercase tracking-[0.2em]">
              <span>✦</span> CREATORS
            </div>
            <h2 className="text-4xl sm:text-5xl font-black leading-tight text-white tracking-tight">The minds defining <br />the Rising creators</h2>
          </div>
          <p className="text-xs text-white/45 font-light max-w-sm font-sans leading-relaxed">Our top rising creators are building distinct direct storefronts and shaping the future of prompt design on Creatopedia.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-6 w-full h-[500px]">
          {risingCreators.map((creator, idx) => {
            const isActive = activeCreator === idx
            return (
              <div
                key={idx}
                onClick={() => setActiveCreator(idx)}
                className="group relative rounded-[32px] overflow-hidden bg-[#111520]/60 backdrop-blur-sm border border-white/10 hover:border-[#ff1f4b]/30 cursor-pointer flex flex-col justify-between transition-all duration-700 h-[500px] md:h-[500px] select-none"
                style={{
                  flexGrow: isActive ? 3 : 1,
                  flexShrink: 1,
                  flexBasis: '0%',
                }}
              >
                <div className="absolute inset-0 z-0">
                  <img
                    src={creator.image}
                    alt={creator.name}
                    className="w-full h-full object-cover object-center opacity-40 group-hover:opacity-55 group-hover:scale-105 transition-all duration-700"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#080c16] via-[#080c16]/50 to-transparent z-10 opacity-90 group-hover:opacity-75 transition-opacity duration-300" />

                {isActive ? (
                  <>
                    <div className="absolute top-8 right-8 flex items-center gap-4 z-20">
                      <div className="flex items-center gap-2.5">
                        <span className="w-8 h-8 rounded-full border border-white/15 bg-white/5 flex items-center justify-center text-white/60 transition-all hover:bg-white/15 hover:border-white/30 cursor-pointer">
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                          </svg>
                        </span>
                      </div>
                      <span className="text-2xl font-mono text-white/30 font-light tracking-tight">0{idx + 1}</span>
                    </div>

                    <div className="relative z-20 p-10 flex flex-col justify-end h-full space-y-4 max-w-lg text-left">
                      <div>
                        <h3 className="text-4xl font-black text-white uppercase tracking-wider leading-none">{creator.name}</h3>
                        <p className="text-sm font-mono text-white/50 uppercase tracking-widest font-light mt-2">{creator.niche}</p>
                      </div>
                      <div>
                        <Link
                          href={creator.name === 'Milan Ray' || creator.name === 'Milan Rayamajhi' ? '/milan/portfolio' : `/${creator.handle.replace('@', '')}/portfolio`}
                          className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-zinc-950 hover:bg-[#ff1f4b] hover:text-white font-mono font-bold text-[10px] uppercase tracking-wider rounded-full shadow-lg transition-all duration-300"
                        >
                          <span>Explore Portfolio</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 z-20 flex flex-col justify-end p-8 select-none h-full w-full">
                    <span className="[writing-mode:vertical-rl] transform rotate-180 uppercase font-medium text-sm tracking-[0.2em] text-white/30 group-hover:text-white transition-all duration-300 mx-auto select-text:none whitespace-nowrap">
                      {creator.name}
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
