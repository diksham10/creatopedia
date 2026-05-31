'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowRight, Eye, Menu, X } from 'lucide-react'

export default function Navbar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  const navItems = [
    { name: 'Creatopedia', href: '/' },
    { name: 'The Experience', href: '/experience' },
    { name: 'Platforms', href: '/platforms' },
    { name: 'Reach Us', href: '/reach-us' },
  ]

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-zinc-950/40 backdrop-blur-xl transition-all duration-300">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between relative z-50">
        <Link href="/" className="flex items-center gap-1 group select-none">
          <span className="text-3xl md:text-2xl font-serif font-bold text-white tracking-tight group-hover:text-white/90 transition-colors">
            Creato
          </span>
          <span
            className="text-3xl md:text-2xl font-bold tracking-tight transition-all duration-300 group-hover:brightness-110"
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

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-8 text-xs font-mono uppercase tracking-[0.2em]">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative px-2 py-1 transition-all duration-300 select-none ${isActive
                  ? 'text-white'
                  : 'text-white/55 hover:text-white/90'
                  }`}
              >
                {item.name}
                {isActive && (
                  <span className="absolute bottom-[-6px] left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500 to-pink-500 rounded-full" />
                )}
              </Link>
            )
          })}
        </div>

        {/* Desktop CTA buttons */}
        <div className="hidden md:flex items-center gap-4">
          <Link
            href="/login"
            className="text-xs font-mono font-semibold uppercase tracking-[0.15em] text-white/70 hover:text-white transition-colors select-none"
          >
            Log In
          </Link>
          <Link
            href="/register"
            className="group flex items-center gap-2.5 bg-zinc-900/40 backdrop-blur-md border border-white/10 px-5 py-2.5 text-xs font-mono font-bold uppercase text-white hover:bg-gradient-to-r hover:from-[#b56bff] hover:to-[#ff1f4b] hover:border-transparent transition-all rounded-full shadow-xl hover:scale-[1.03] select-none"
          >
            <span>Sign Up</span>
          </Link>
        </div>

        {/* Mobile Hamburger menu button on the right */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex md:hidden items-center justify-center w-10 h-10 rounded-xl bg-zinc-900/50 backdrop-blur-md border border-white/10 text-white hover:bg-white/5 transition-all focus:outline-none select-none z-50"
          aria-label="Toggle Menu"
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu Dropdown overlay/panel - centered perfectly on full height */}
      <div
        className={`fixed inset-0 h-screen bg-zinc-950/98 backdrop-blur-2xl z-40 md:hidden flex flex-col justify-center items-center gap-10 transition-all duration-500 ${
          isOpen ? 'opacity-100 pointer-events-auto visible' : 'opacity-0 pointer-events-none invisible translate-y-[-10px]'
        }`}
      >
        <div className="flex flex-col items-center gap-8 text-lg font-mono uppercase tracking-[0.25em]">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`relative px-4 py-2 transition-all duration-300 select-none text-center ${
                  isActive ? 'text-white font-bold' : 'text-white/60 hover:text-white'
                }`}
              >
                {item.name}
              </Link>
            )
          })}
        </div>

                <div className="flex flex-col items-center gap-4 mt-2">
          <Link
            href="/login"
            onClick={() => setIsOpen(false)}
            className="text-white/60 hover:text-white text-xs font-mono font-bold uppercase tracking-[0.2em] transition-colors select-none"
          >
            Log In
          </Link>
          <Link
            href="/register"
            onClick={() => setIsOpen(false)}
            className="group flex items-center gap-2.5 bg-zinc-900/40 backdrop-blur-md border border-white/15 px-6 py-3.5 text-xs font-mono font-bold uppercase text-white hover:bg-gradient-to-r hover:from-[#b56bff] hover:to-[#ff1f4b] hover:border-transparent transition-all rounded-full shadow-xl hover:scale-[1.03] select-none"
          >
            <span>Sign Up</span>
          </Link>
        </div>
      </div>
    </nav>
  )
}
