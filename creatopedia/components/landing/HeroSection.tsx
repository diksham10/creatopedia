'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Sparkles, MoveRight } from 'lucide-react'

export default function HeroSection() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
  }

  return (
    <section
      onMouseMove={handleMouseMove}
      className="relative min-h-screen flex flex-col justify-center overflow-hidden group select-none bg-transparent"
    >
      {/* Background glow & gradients EXACT 1080TV DUAL GRADIENT STYLE */}
      <div
        className="absolute inset-0 z-0 pointer-events-none transition-opacity duration-500"
        style={{
          background: [
            'radial-gradient(ellipse 100% 70% at 50% -5%, rgba(28,55,170,0.65) 0%, transparent 65%)',
            'radial-gradient(ellipse 60% 50% at 102% 105%, rgba(155,15,50,0.60) 0%, transparent 60%)',
          ].join(', '),
        }}
      />

      {/* Interactive mouse glow */}
      <div
        className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700 z-0"
        style={{
          background: `radial-gradient(450px circle at ${mousePos.x}px ${mousePos.y}px, rgba(108,99,255,0.06), transparent 50%)`,
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-16 flex flex-col items-center justify-center text-center space-y-8">
        {/* Pill Tag */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900/60 backdrop-blur-md border border-white/10 text-white/70 text-[6px] font-mono uppercase tracking-[0.22em] animate-in fade-in slide-in-from-top-4 duration-700">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          ENCYCLOPEDIA OF CREATIVITY
        </div>

        {/* Big headline */}
        <h1 className="text-8xl sm:text-6xl md:text-[84px] font-black leading-[1.05] tracking-tight max-w-5xl animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <span className="text-white block">We craft stories</span>
          <span
            className="block mt-2 pb-1"
            style={{
              background: 'linear-gradient(90deg, #3b82f6 0%, #a855f7 40%, #ec4899 75%, #ef4444 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            that move.
          </span>
        </h1>

        {/* Subtext */}
        <p className="text-sm md:text-lg text-white/55 max-w-2xl mx-auto leading-relaxed font-light animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200">
          Six capabilities, one cohesive vision. From elite creator networks to a complete multi-tier brand ecosystem — we build digital stories and assets that outlast the moment.
        </p>

        {/* Pill Action Links */}
        <div className="inline-flex flex-wrap justify-center items-center bg-zinc-900/40 border border-white/10 rounded-full p-1.5 gap-1 backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
          {[
            { label: 'The Experience', href: '/experience' },
            { label: 'Platforms', href: '/platforms' },
            { label: 'Reach Us', href: '/reach-us' },
          ].map((tab) => (
            <Link
              key={tab.label}
              href={tab.href}
              className="flex items-center gap-2 px-5 md:px-6 py-3 rounded-full text-xs font-mono text-white/60 hover:text-white hover:bg-white/10 transition-all tracking-wider select-none"
            >
              <Sparkles className="w-3.5 h-3.5 text-white/35 group-hover:text-white" />
              {tab.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Hero Quick Metrics or Cards exactly matching the lower row in visual UI */}
      {/* <div className="relative z-10 w-full max-w-6xl mx-auto px-6 pb-20 grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in zoom-in-95 duration-1000 delay-500">
        {[
          { title: 'Elite Network', desc: 'Connecting digital innovators with top tier clients.', icon: '🎯' },
          { title: 'Immersive Video', desc: 'Studio-grade video production & cinematic curation.', icon: '🎥' },
          { title: 'Global Reach', desc: 'Expand your audience base over multiple regions.', icon: '🌐' },
        ].map((feat, idx) => (
          <div key={idx} className="group p-6 bg-zinc-900/40 backdrop-blur-lg border border-white/5 hover:border-white/20 transition-all duration-500 rounded-2xl flex flex-col gap-4 select-none">
            <span className="text-3xl">{feat.icon}</span>
            <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">{feat.title}</h3>
            <p className="text-xs text-white/50 leading-relaxed font-light">{feat.desc}</p>
          </div>
        ))}
      </div> */}
    </section>
  )
}
