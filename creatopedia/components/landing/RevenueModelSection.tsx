'use client'

import React from 'react'
import { Newspaper, FileText, Lock, ArrowRight } from 'lucide-react'

export default function RevenueModelSection() {
  return (
    <section id="revenue-model" className="py-36 px-6 select-none bg-transparent relative overflow-hidden group">
      <div
        className="absolute inset-0 z-0 pointer-events-none opacity-40 group-hover:opacity-60 transition-opacity duration-700"
        style={{
          background: [
            'radial-gradient(ellipse 75% 60% at 10% 20%, rgba(28,55,170,0.30) 0%, transparent 60%)',
            'radial-gradient(ellipse 65% 50% at 90% 80%, rgba(155,15,50,0.25) 0%, transparent 60%)',
          ].join(', ')
        }}
      />

      <div className="max-w-7xl mx-auto space-y-24 relative z-10">
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#111520]/80 border border-white/10 text-[#ff1f4b] text-[10px] font-mono uppercase tracking-[0.2em]">
            <span>✦</span> Revenue Model
          </div>
          <h2 className="text-4xl sm:text-5xl font-black leading-tight text-white tracking-tight">
            Three ways to earn — <br />
            <span className="italic font-light text-white/80">your content, your rules</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/5 border-t border-b md:border-none border-white/5 py-12 md:py-0">
          {[
            {
              icon: Newspaper,
              title: 'Ads on Your Page',
              desc: 'Brands pay to place ads on your creator profile and content pages. You earn passively just by having an audience.',
              tag: 'Passive Income'
            },
            {
              icon: FileText,
              title: 'Sell What You Create',
              desc: 'Upload PDFs, guides, templates, courses, and e-books. Set your price. Buyers pay directly — no middleman cut beyond platform fee.',
              tag: 'Direct Sales'
            },
            {
              icon: Lock,
              title: 'Premium Content Access',
              desc: 'Lock your best tutorials, videos, or resources behind a paywall. Only paying subscribers or one-time buyers get in.',
              tag: 'Recurring Revenue'
            }
          ].map((stream, idx) => {
            const StreamIcon = stream.icon
            return (
              <div
                key={idx}
                className="group/stream px-8 py-12 md:py-8 flex flex-col justify-between items-start gap-8 hover:bg-white/[0.01] hover:scale-[1.02] transition-all duration-500 relative first:pl-0 last:pr-0"
              >
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#ff1f4b]/0 to-transparent transition-all duration-700" />

                <div className="space-y-6">
                  <div className="flex items-center justify-between w-full">
                    <div className="w-14 h-14 bg-[#111520]/80 border border-white/10 rounded-2xl flex items-center justify-center text-white/60 group-hover/stream:text-white/80 transition-all duration-500">
                      <StreamIcon className="w-6 h-6 transition-transform group-hover/stream:scale-110 duration-500" />
                    </div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#ff1f4b]/60 border border-[#ff1f4b]/20 bg-[#ff1f4b]/5 px-3 py-1.5 rounded-full transition-all duration-500">
                      {stream.tag}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-2xl font-black text-white transition-colors leading-tight tracking-tight">
                      {stream.title}
                    </h3>
                    <p className="text-xs sm:text-sm font-sans text-white/50 leading-relaxed font-light transition-colors">
                      {stream.desc}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[11px] font-mono font-bold uppercase tracking-widest text-white/20 transition-colors mt-auto">
                  <span>Explore details</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover/stream:translate-x-1 transition-transform" />
                </div>
              </div>
            )
          })}
        </div>

        <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row items-center justify-center gap-4 text-center max-w-3xl mx-auto">
          <span className="w-2 h-2 rounded-full bg-[#ff1f4b] flex-shrink-0 animate-pulse" />
          <p className="font-sans text-xs md:text-sm text-white/45 font-light leading-relaxed">
            Creatopedia takes a small platform fee only when you earn. Zero cost to list. Zero monthly subscription.
          </p>
        </div>
      </div>
    </section>
  )
}
