'use client'

import React from 'react'
import { Rocket, Layers, TrendingUp, ArrowRight } from 'lucide-react'

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-36 px-6 bg-transparent select-none relative overflow-hidden group">
      <div
        className="absolute inset-0 z-0 pointer-events-none opacity-40 group-hover:opacity-55 transition-opacity duration-700"
        style={{
          background: [
            'radial-gradient(ellipse 75% 60% at 15% 15%, rgba(28,55,170,0.30) 0%, transparent 60%)',
            'radial-gradient(ellipse 65% 50% at 85% 85%, rgba(155,15,50,0.25) 0%, transparent 60%)',
          ].join(', ')
        }}
      />

      <div className="max-w-7xl mx-auto space-y-16 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#111520]/80 border border-white/10 text-[#ff1f4b] text-[10px] font-mono uppercase tracking-[0.2em]">
              <span>✦</span> Process
            </div>
            <h2 className="text-4xl sm:text-5xl font-black leading-tight text-white tracking-tight">
              How It Works <span className="italic font-light">(Creators)</span>
            </h2>
          </div>
          <p className="text-xs text-white/45 font-light max-w-sm font-sans leading-relaxed">
            Monetizing your audience doesn&apos;t need to be complex. Claim your spot, upload your items, and grow with us.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-white/5 -translate-y-1/2 hidden md:block z-0" />
          {[
            {
              step: '01',
              title: 'Claim Your Storefront',
              desc: 'Set up your direct, custom-built digital storefront within 2 minutes. Own your profile link and highlight your professional presence.',
              icon: Rocket
            },
            {
              step: '02',
              title: 'List Your Digital Assets',
              desc: 'Publish your prompts, Notion kits, or art collections effortlessly. Control the pricing and structure what you offer completely.',
              icon: Layers
            },
            {
              step: '03',
              title: 'Direct Sales & Growth',
              desc: 'Sell directly to a ready-to-buy community. Leverage optimized conversion pipelines to continuously grow your earnings.',
              icon: TrendingUp
            }
          ].map((item, idx) => {
            const StepIcon = item.icon
            return (
              <div key={idx} className="group/step bg-[#111520]/60 backdrop-blur-sm p-10 border border-white/10 rounded-[32px] hover:scale-[1.03] transition-all duration-500 relative flex flex-col justify-between h-[360px] select-none z-10">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="w-14 h-14 rounded-2xl bg-[#ff1f4b]/10 border border-[#ff1f4b]/20 flex items-center justify-center text-[#ff1f4b] transition-all duration-500">
                      <StepIcon className="w-6 h-6 transition-transform group-hover/step:scale-110" />
                    </div>
                    <span className="font-mono text-3xl text-white/10 group-hover/step:text-white/20 font-black tracking-tight transition-colors">
                      {item.step}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white leading-tight tracking-wide pr-8">
                      {item.title}
                    </h3>
                    <p className="text-sm font-sans text-white/45 mt-4 leading-relaxed font-light">
                      {item.desc}
                    </p>
                  </div>
                </div>
                <div className="pt-6 border-t border-white/5 text-[11px] font-mono font-bold uppercase tracking-widest text-[#ff1f4b]/60 flex items-center gap-2 transition-colors">
                  <span>Join early</span> <ArrowRight className="w-3.5 h-3.5 group-hover/step:translate-x-1 transition-transform" />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
