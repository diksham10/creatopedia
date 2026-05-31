'use client'

import React from 'react'
import { Sparkles, Layers, Zap, ShoppingBag } from 'lucide-react'

export default function WhatYouCanListSection() {
  return (
    <section id="what-you-can-list" className="py-36 px-6 bg-transparent select-none relative overflow-hidden group">
      <div
        className="absolute inset-0 z-0 pointer-events-none opacity-40 group-hover:opacity-55 transition-opacity duration-700"
        style={{
          background: [
            'radial-gradient(ellipse 75% 60% at 85% 15%, rgba(155,15,50,0.30) 0%, transparent 60%)',
            'radial-gradient(ellipse 65% 50% at 15% 85%, rgba(28,55,170,0.25) 0%, transparent 60%)',
          ].join(', ')
        }}
      />

      <div className="max-w-7xl mx-auto space-y-16 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#111520]/80 border border-white/10 text-[#ff1f4b] text-[10px] font-mono uppercase tracking-[0.2em]">
              <span>✦</span> Sell Anything
            </div>
            <h2 className="text-4xl sm:text-5xl font-black leading-tight text-white tracking-tight">
              What You <span className="italic font-light">Can List</span>
            </h2>
          </div>
          <p className="text-xs text-white/45 font-light max-w-sm font-sans leading-relaxed">
            Every creation has a buyer. Diversify your portfolio and showcase what makes your expertise unique on our platform.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {[
            {
              title: 'Premium Prompt Packs',
              desc: 'Highly engineered prompt libraries across models (ChatGPT, Claude, Midjourney).',
              icon: Sparkles,
              tag: 'AI Tools'
            },
            {
              title: 'Digital Goods & Templates',
              desc: 'Richly crafted systems, complete Notion workspace blueprints, and life-organizing frameworks.',
              icon: Layers,
              tag: 'Organization'
            },
            {
              title: 'Workflows & Snippets',
              desc: 'Specialized code bases, automation flows, scripts, and developer productivity tools.',
              icon: Zap,
              tag: 'Code'
            },
            {
              title: 'AI Arts & Media',
              desc: 'Exclusive collections of AI-generated assets, premium digital wallpapers, and high-res media.',
              icon: ShoppingBag,
              tag: 'Art Assets'
            }
          ].map((item, idx) => {
            const ItemIcon = item.icon
            return (
              <div key={idx} className="group/item bg-[#111520]/60 backdrop-blur-sm p-8 border border-white/10 rounded-3xl hover:scale-[1.02] transition-all duration-500 flex flex-col justify-between h-[320px] select-none">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="w-12 h-12 rounded-full border border-white/15 bg-white/5 flex items-center justify-center transition-all duration-500">
                      <ItemIcon className="w-5 h-5 text-white/60 transition-colors" />
                    </div>
                    <span className="font-mono text-[9px] text-[#ff1f4b]/60 border border-[#ff1f4b]/20 bg-[#ff1f4b]/5 rounded-full px-2.5 py-1 tracking-wider uppercase transition-all duration-500 font-bold">
                      {item.tag}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white leading-tight">
                      {item.title}
                    </h3>
                    <p className="text-xs font-sans text-white/45 mt-3 leading-relaxed font-light">
                      {item.desc}
                    </p>
                  </div>
                </div>
                <div className="pt-4 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-white/30 transition-colors">
                  <span>Instantly available</span>
                  <span>✦</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
