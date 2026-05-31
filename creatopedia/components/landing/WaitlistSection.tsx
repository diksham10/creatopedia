'use client'

import React, { useState } from 'react'

export default function WaitlistSection() {
  const [creatorForm, setCreatorForm] = useState({
    name: '',
    email: '',
    niche: 'Midjourney',
    platform: ''
  })
  const [creatorSubmitted, setCreatorSubmitted] = useState(false)

  const niches = [
    'Midjourney', 'ChatGPT', 'Claude', 'Runway', 'Stable Diffusion', 'Copywriting', 'SEO', 'Design', 'Marketing'
  ]

  const handleCreatorSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!creatorForm.name || !creatorForm.email) return
    setCreatorSubmitted(true)
  }

  return (
    <section id="join-waitlist" className="py-36 px-6 bg-transparent relative overflow-hidden group select-none">
      <div
        className="absolute inset-0 z-0 pointer-events-none opacity-40 group-hover:opacity-60 transition-opacity duration-700"
        style={{
          background: [
            'radial-gradient(ellipse 90% 70% at 20% -5%, rgba(28,55,170,0.35) 0%, transparent 60%)',
            'radial-gradient(ellipse 60% 50% at 80% 105%, rgba(155,15,50,0.40) 0%, transparent 60%)',
          ].join(', ')
        }}
      />

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-start relative z-10">
        <div className="space-y-12 max-w-xl">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#111520]/80 border border-white/10 text-[#ff1f4b] text-[10px] font-mono uppercase tracking-[0.2em]">
              <span>✦</span> Waitlist
            </div>
            <h2 className="text-4xl sm:text-5xl font-black leading-tight text-white tracking-tight">
              Tapping into an engaged, <br />
              <span className="italic font-light">ready-to-buy</span> community.
            </h2>
            <p className="text-base text-white/60 leading-relaxed font-light font-sans">
              We don&apos;t just curate prompts; we create culture. Our audiences are direct, targeted, and highly engaged early adopters.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-10">
            {[
              { metric: '8%+', label: 'Higher Engagement' },
              { metric: '70%', label: 'International Reach' },
              { metric: '50+', label: 'Enterprise Clients' },
              { metric: '100k+', label: 'Monthly Impressions' }
            ].map((m, idx) => (
              <div key={idx} className="space-y-1">
                <div className="text-4xl font-black text-white leading-none tracking-tight">{m.metric}</div>
                <div className="text-[10px] font-mono text-white/40 tracking-wider uppercase">{m.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="w-full bg-[#111520]/60 backdrop-blur-sm p-10 border border-white/10 hover:border-[#ff1f4b]/30 transition-all duration-500 rounded-3xl">
          {creatorSubmitted ? (
            <div className="text-center py-12 space-y-4">
              <div className="text-5xl text-[#ff1f4b] mb-4 animate-bounce">✦</div>
              <h3 className="text-2xl font-black text-white leading-tight">Welcome to the Inner Circle</h3>
              <p className="text-sm text-white/60 leading-relaxed font-light">Your request has been registered. We will reach out when your spot is ready.</p>
            </div>
          ) : (
            <form onSubmit={handleCreatorSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="font-mono text-[10px] uppercase tracking-widest text-white/45">Full Name</label>
                <input
                  required
                  type="text"
                  value={creatorForm.name}
                  onChange={(e) => setCreatorForm({ ...creatorForm, name: e.target.value })}
                  placeholder="E.g. Milan Ray"
                  className="w-full bg-[#111520]/40 border border-white/10 hover:border-white/30 focus:border-[#ff1f4b] focus:outline-none p-4 text-sm tracking-wide text-white transition-colors rounded-2xl"
                />
              </div>

              <div className="space-y-2">
                <label className="font-mono text-[10px] uppercase tracking-widest text-white/45">Email Address</label>
                <input
                  required
                  type="email"
                  value={creatorForm.email}
                  onChange={(e) => setCreatorForm({ ...creatorForm, email: e.target.value })}
                  placeholder="milan@creator.com"
                  className="w-full bg-[#111520]/40 border border-white/10 hover:border-white/30 focus:border-[#ff1f4b] focus:outline-none p-4 text-sm tracking-wide text-white transition-colors rounded-2xl"
                />
              </div>

              <div className="space-y-2">
                <label className="font-mono text-[10px] uppercase tracking-widest text-white/45">Primary Focus</label>
                <select
                  value={creatorForm.niche}
                  onChange={(e) => setCreatorForm({ ...creatorForm, niche: e.target.value })}
                  className="w-full bg-[#111520]/40 border border-white/10 hover:border-white/30 focus:border-[#ff1f4b] focus:outline-none p-4 text-sm tracking-wide text-white transition-colors font-mono rounded-2xl"
                >
                  {niches.map((n, i) => (
                    <option key={i} value={n} className="bg-[#080c16] text-white">{n}</option>
                  ))}
                  <option value="Other" className="bg-[#080c16] text-white">Other</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="font-mono text-[10px] uppercase tracking-widest text-white/45">Portfolio / Social Link</label>
                <input
                  required
                  type="text"
                  value={creatorForm.platform}
                  onChange={(e) => setCreatorForm({ ...creatorForm, platform: e.target.value })}
                  placeholder="E.g. twitter.com/milan"
                  className="w-full bg-[#111520]/40 border border-white/10 hover:border-white/30 focus:border-[#ff1f4b] focus:outline-none p-4 text-sm tracking-wide text-white transition-colors rounded-2xl"
                />
              </div>

              <button type="submit" className="w-full bg-white hover:bg-[#ff1f4b] hover:text-white py-5 text-sm font-mono font-bold uppercase tracking-widest text-[#080c16] transition-all border border-transparent rounded-full shadow-lg hover:scale-[1.01]">
                Request Early Access
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
