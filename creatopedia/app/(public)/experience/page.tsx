'use client'

import React from 'react'
import Navbar from '@/components/landing/Navbar'
import ExperienceSection from '@/components/landing/ExperienceSection'
import Footer from '@/components/landing/Footer'

export default function ExperiencePage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-pink-500/30 font-sans antialiased overflow-x-hidden">
      <Navbar />
      <main className="pt-20">
        <ExperienceSection />
      </main>
      <Footer />
    </div>
  )
}
