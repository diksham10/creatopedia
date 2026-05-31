'use client'

import React, { useState } from 'react'
import { Sparkles, Eye, ShieldCheck, Mail, Send } from 'lucide-react'

export default function ReachUsSection() {
  const [activeTab, setActiveTab] = useState<'creators' | 'brands' | 'sponsors'>('creators')

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  })
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.email) return
    setIsSubmitted(true)
    setFormData({ name: '', email: '', subject: '', message: '' })
  }

  return (
    <section className="py-32 px-6 bg-transparent select-none relative overflow-hidden">
      {/* Dynamic background gradient */}
      <div
        className="absolute inset-0 z-0 pointer-events-none opacity-40"
        style={{
          background: 'radial-gradient(ellipse 70% 55% at 20% 90%, rgba(139,92,246,0.3) 0%, transparent 60%)',
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto space-y-16">
        {/* Title */}
        <div className="text-center space-y-6 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900/60 backdrop-blur-md border border-white/10 text-white/70 text-[10px] font-mono uppercase tracking-[0.2em]">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
            CONTACT US
          </div>
          <h2 className="text-4xl sm:text-5xl font-black leading-tight tracking-tight text-white">
            Get in touch with{' '}
            <span
              style={{
                background: 'linear-gradient(90deg, #8b5cf6 0%, #ec4899 50%, #ef4444 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Creatopedia.
            </span>
          </h2>
          <p className="text-xs text-white/50 leading-relaxed font-light">
            We are always excited to collaborate. Select your focus below and send over your details.
          </p>
        </div>

        {/* TOGGLE TAB ON TOP IN GLASSMORPHISM EFFECT */}
        <div className="flex justify-center">
          <div className="inline-flex bg-zinc-900/40 border border-white/10 rounded-full p-1.5 backdrop-blur-lg gap-1 select-none animate-in fade-in zoom-in-95 duration-1000">
            {(['creators', 'brands', 'sponsors'] as const).map((tab) => {
              const isActive = activeTab === tab
              return (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab)
                    setIsSubmitted(false)
                  }}
                  className={`px-6 py-3 rounded-full text-xs font-mono font-bold uppercase tracking-widest transition-all duration-300 ${
                    isActive
                      ? 'bg-gradient-to-r from-[#8b5cf6] to-[#ec4899] text-white shadow-lg'
                      : 'text-white/40 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {tab === 'creators' && 'For Creators'}
                  {tab === 'brands' && 'For Brands'}
                  {tab === 'sponsors' && 'For Sponsors'}
                </button>
              )
            })}
          </div>
        </div>

        {/* WELL MAINTAINED FORM */}
        <div className="max-w-xl mx-auto bg-zinc-900/40 backdrop-blur-xl p-8 sm:p-10 border border-white/10 hover:border-pink-500/20 transition-all duration-500 rounded-3xl animate-in fade-in slide-in-from-bottom-4 duration-700">
          {isSubmitted ? (
            <div className="text-center py-12 space-y-4">
              <div className="text-5xl text-pink-500 mb-4 animate-bounce">✦</div>
              <h3 className="text-2xl font-black text-white leading-tight">Your request has been received</h3>
              <p className="text-sm text-white/50 leading-relaxed font-light">
                One of our elite customer success agents will reach back to you shortly.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="font-mono text-[10px] uppercase tracking-widest text-white/40">Full Name</label>
                <input
                  required
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="E.g. Milan Ray"
                  className="w-full bg-zinc-950/40 border border-white/10 hover:border-white/20 focus:border-indigo-500/50 focus:outline-none p-4 text-sm tracking-wide text-white transition-colors rounded-2xl placeholder-white/20"
                />
              </div>

              <div className="space-y-2">
                <label className="font-mono text-[10px] uppercase tracking-widest text-white/40">Email Address</label>
                <input
                  required
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="milan@creator.com"
                  className="w-full bg-zinc-950/40 border border-white/10 hover:border-white/20 focus:border-indigo-500/50 focus:outline-none p-4 text-sm tracking-wide text-white transition-colors rounded-2xl placeholder-white/20"
                />
              </div>

              <div className="space-y-2">
                <label className="font-mono text-[10px] uppercase tracking-widest text-white/40">Subject</label>
                <input
                  required
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  placeholder={`E.g. Partnership ${activeTab === 'creators' ? 'as a Creator' : activeTab === 'brands' ? 'for Brands' : 'as a Sponsor'}`}
                  className="w-full bg-zinc-950/40 border border-white/10 hover:border-white/20 focus:border-indigo-500/50 focus:outline-none p-4 text-sm tracking-wide text-white transition-colors rounded-2xl placeholder-white/20"
                />
              </div>

              <div className="space-y-2">
                <label className="font-mono text-[10px] uppercase tracking-widest text-white/40">Message</label>
                <textarea
                  required
                  rows={4}
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder={`Write down your message to us regarding the platform...`}
                  className="w-full bg-zinc-950/40 border border-white/10 hover:border-white/20 focus:border-indigo-500/50 focus:outline-none p-4 text-sm tracking-wide text-white transition-colors rounded-2xl h-32 placeholder-white/20 resize-none"
                />
              </div>

              {/* LET'S TAKE A LOOK CTA button with eye icon as requested */}
              <button
                type="submit"
                className="group w-full bg-white hover:bg-gradient-to-r hover:from-indigo-500 hover:to-pink-500 hover:text-white py-5 text-sm font-mono font-bold uppercase tracking-widest text-zinc-950 transition-all border border-transparent rounded-full shadow-lg hover:scale-[1.01] flex items-center justify-center gap-2.5"
              >
                <span>Let&apos;s take a look</span>
                <Eye className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" />
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
