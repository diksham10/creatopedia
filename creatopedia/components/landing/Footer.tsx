'use client'

import React from 'react'
import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="py-24 px-6 border-t border-white/5 bg-zinc-950 select-none">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-20">
          <div className="space-y-6">
            <Link href="/" className="flex items-center gap-1 group">
              <span className="text-2xl font-serif italic font-medium text-white tracking-tight">
                Creato
              </span>
              <span
                className="text-2xl font-bold tracking-tight"
                style={{
                  background: 'linear-gradient(90deg, #6c63ff 0%, #b56bff 35%, #ff4e7a 70%, #ff1f4b 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                pedia
              </span>
            </Link>
            <p className="text-xs text-white/40 leading-relaxed font-light max-w-sm">
              The unified discovery layer for elite digital creators, brands, and sponsors.
            </p>
          </div>
          <div className="space-y-6">
            <h4 className="font-mono text-xs font-bold uppercase tracking-widest text-white/50">Platforms</h4>
            <ul className="space-y-4 text-xs font-light text-white/40">
              <li><Link href="/platforms" className="hover:text-white transition-colors">Creators Showcase</Link></li>
              <li><Link href="/platforms" className="hover:text-white transition-colors">Categories</Link></li>
            </ul>
          </div>
          <div className="space-y-6">
            <h4 className="font-mono text-xs font-bold uppercase tracking-widest text-white/50">Experience</h4>
            <ul className="space-y-4 text-xs font-light text-white/40">
              <li><Link href="/experience" className="hover:text-white transition-colors">Our Vision</Link></li>
              <li><Link href="/reach-us" className="hover:text-white transition-colors">Contact us</Link></li>
            </ul>
          </div>
          <div className="space-y-6">
            <h4 className="font-mono text-xs font-bold uppercase tracking-widest text-white/50">Company</h4>
            <ul className="space-y-4 text-xs font-light text-white/40">
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>
        <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-8">
          <span className="font-mono text-[10px] text-white/30 tracking-widest">
            © 2026 CREATOPEDIA PLATFORM. ALL RIGHTS RESERVED.
          </span>
          <div className="flex gap-8 font-mono text-[10px] text-white/30 tracking-wider">
            <Link href="/terms" className="hover:text-white transition-colors">TERMS</Link>
            <Link href="/privacy-policy" className="hover:text-white transition-colors">PRIVACY</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
