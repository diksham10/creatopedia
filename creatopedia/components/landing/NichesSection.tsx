'use client'

import React from 'react'
import { Cpu, Palette, Activity, Heart, Car } from 'lucide-react'

export default function NichesSection() {
  return (
    <section id="niches" className="py-36 px-6 bg-transparent select-none relative overflow-hidden group">
      <div
        className="absolute inset-0 z-0 pointer-events-none opacity-40 group-hover:opacity-55 transition-opacity duration-700"
        style={{
          background: [
            'radial-gradient(ellipse 75% 60% at 10% 20%, rgba(28,55,170,0.30) 0%, transparent 60%)',
            'radial-gradient(ellipse 65% 50% at 90% 80%, rgba(155,15,50,0.25) 0%, transparent 60%)',
          ].join(', ')
        }}
      />

      <div className="max-w-7xl mx-auto space-y-16 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#111520]/80 border border-white/10 text-[#ff1f4b] text-[10px] font-mono uppercase tracking-[0.2em]">
              <span>✦</span> Discovery
            </div>
            <h2 className="text-4xl sm:text-5xl font-black leading-tight text-white tracking-tight">
              Explore Diverse <span className="italic font-light">Niche Showcase</span>
            </h2>
          </div>
          <p className="text-xs text-white/45 font-light max-w-sm font-sans leading-relaxed">
            Find exactly what you are looking for. Creators on Creatopedia lead across multiple industries with exceptional digital goods.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {[
            { id: 'tech', name: 'Tech & Dev', icon: Cpu, desc: 'Advanced coding scripts, AI workflows, and prompts for modern tech stacks.', num: '01', grad: 'from-blue-500/20' },
            { id: 'creative', name: 'Creative', icon: Palette, desc: 'Midjourney, Stable Diffusion, and prompt design for stunning digital art.', num: '02', grad: 'from-pink-500/20' },
            { id: 'fitness', name: 'Fitness', icon: Activity, desc: 'Custom routines, habit trackers, and high-quality coaching templates.', num: '03', grad: 'from-emerald-500/20' },
            { id: 'lifestyle', name: 'Lifestyle', icon: Heart, desc: 'Life operating systems, productivity prompts, and habit planners.', num: '04', grad: 'from-amber-500/20' },
            { id: 'automobiles', name: 'Automobiles', icon: Car, desc: 'Vehicle configuration setups, mod guides, and auto-enthusiast assets.', num: '05', grad: 'from-red-500/20' }
          ].map((niche, idx) => {
            const NicheIcon = niche.icon
            return (
              <div
                key={idx}
                className={`group/niche flex flex-col justify-between h-[280px] bg-[#111520]/70 backdrop-blur-sm border border-white/10 rounded-3xl p-8 hover:scale-[1.03] transition-all duration-500 relative overflow-hidden select-none bg-gradient-to-b ${niche.grad} to-transparent`}
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 group-hover/niche:bg-white/10 flex items-center justify-center transition-all duration-500">
                      <NicheIcon className="w-5 h-5 text-white/70 transition-colors" />
                    </div>
                    <span className="font-mono text-2xl text-white/10 group-hover/niche:text-white/20 font-black tracking-tight transition-colors">
                      {niche.num}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white leading-tight tracking-wide transition-colors">
                      {niche.name}
                    </h3>
                    <p className="text-xs font-sans text-white/45 mt-3 leading-relaxed font-light">
                      {niche.desc}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
