'use client'

import React from 'react'
import { CheckCircle2, TrendingUp, Award, Layers } from 'lucide-react'

export default function ExperienceSection() {
  const experiences = [
    {
      title: 'For Creators',
      desc: 'Build direct, high-impact storefronts to instantly distribute and monetize your AI workflows, prompt packs, and custom templates.',
      icon: Award,
    },
    {
      title: 'For Visitors',
      desc: 'Unlock access to fully tested, production-grade digital goods curated directly by elite engineers from across the world.',
      icon: CheckCircle2,
    },
    {
      title: 'For Brands',
      desc: 'Integrate custom-fit prompt layers and programmatic digital tools to supercharge content production without losing voice.',
      icon: TrendingUp,
    },
    {
      title: 'For Sponsors',
      desc: 'Sponsor the top 1% creators in your specific niche to build brand authority and hyper-focused consumer alignment.',
      icon: Layers,
    },
  ]

  const stats = [
    { label: 'Projects', value: '0+' },
    { label: 'Events', value: '0+' },
    { label: 'Brands', value: '0+' },
    { label: 'Community', value: '0+  ' },
  ]

  return (
    <section className="py-32 px-6 bg-transparent relative overflow-hidden select-none">
      {/* Background radial gradient */}
      <div
        className="absolute inset-0 z-0 pointer-events-none opacity-40"
        style={{
          background: 'radial-gradient(ellipse 65% 50% at 50% 50%, rgba(155,15,50,0.35) 0%, transparent 60%)',
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto space-y-24">
        {/* TOP INTRO */}
        <div className="text-center space-y-6 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900/60 backdrop-blur-md border border-white/10 text-white/70 text-[10px] font-mono uppercase tracking-[0.2em]">
            <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse" />
            YOUR WORK SPEAKS
          </div>
          <h2 className="text-4xl sm:text-6xl font-black leading-tight tracking-tight text-white animate-in fade-in slide-in-from-bottom-4 duration-700">
            Every Frame{' '}
            <span
              style={{
                background: 'linear-gradient(90deg, #ec4899 0%, #8b5cf6 50%, #3b82f6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Tells a Story.
            </span>
          </h2>
          <p className="text-sm md:text-base text-white/50 leading-relaxed font-light">
            A curated look at the brands we&apos;ve built, the events we&apos;ve captured, and the stories we&apos;ve told. We bridge the gap between initial creation and massive global scale.
          </p>
        </div>

        {/* 4 COLUMNS: Creators, Visitors, Brands, Sponsors */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-200">
          {experiences.map((exp, idx) => {
            const ExpIcon = exp.icon
            return (
              <div
                key={idx}
                className="group p-8 bg-zinc-900/40 backdrop-blur-md border border-white/5 hover:border-pink-500/30 transition-all duration-500 rounded-2xl flex flex-col justify-between h-[320px] select-none hover:scale-[1.02]"
              >
                <div className="space-y-6">
                  <div className="w-12 h-12 bg-zinc-800/80 border border-white/10 rounded-xl flex items-center justify-center text-pink-500 group-hover:text-pink-400 group-hover:scale-110 transition-all duration-500">
                    <ExpIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white transition-colors tracking-tight">
                      {exp.title}
                    </h3>
                    <p className="text-xs text-white/50 leading-relaxed font-light mt-3">
                      {exp.desc}
                    </p>
                  </div>
                </div>
                <div className="pt-4 border-t border-white/5 text-[10px] font-mono text-white/30 uppercase tracking-widest flex items-center justify-between">
                  <span>Elite Ecosystem</span>
                  <span>✦</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* STATS SECTION - EXACT MATCHING TO THE SECOND SCREENSHOT */}
        <div className="pt-16 border-t border-white/5 grid grid-cols-2 md:grid-cols-4 gap-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
          {stats.map((stat, i) => (
            <div key={i} className="space-y-2">
              <div
                className="text-4xl md:text-6xl font-black tracking-tight leading-none"
                style={{
                  background: 'linear-gradient(135deg, #ffffff 0%, #a1a1aa 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {stat.value}
              </div>
              <div className="text-[10px] font-mono text-white/40 uppercase tracking-[0.25em]">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
