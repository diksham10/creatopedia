'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Sparkles } from 'lucide-react'
import Navbar from '@/components/landing/Navbar'
import HeroSection from '@/components/landing/HeroSection'
import ExperienceSection from '@/components/landing/ExperienceSection'
import EvolutionSection from '@/components/landing/EvolutionSection'
import PlatformsSection from '@/components/landing/PlatformsSection'
import NichesSection from '@/components/landing/NichesSection'
import WhatYouCanListSection from '@/components/landing/WhatYouCanListSection'
import HowItWorksSection from '@/components/landing/HowItWorksSection'
import RisingCreatorsSection from '@/components/landing/RisingCreatorsSection'
import RevenueModelSection from '@/components/landing/RevenueModelSection'
import WaitlistSection from '@/components/landing/WaitlistSection'
import Footer from '@/components/landing/Footer'

const fadeUpVariant = {
  initial: { opacity: 0, y: 50 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-120px' },
  transition: { duration: 0.8 }
}

export default function CreatopediaLanding() {
  return (
    <div className="min-h-screen bg-[#070913] text-white selection:bg-pink-500/30 font-sans antialiased overflow-x-hidden relative">
      <div className="absolute inset-0 z-0 pointer-events-none opacity-40 select-none" style={{ background: 'radial-gradient(ellipse 100% 70% at 50% 0%, rgba(28,55,170,0.35) 0%, transparent 55%), radial-gradient(ellipse 60% 50% at 100% 100%, rgba(155,15,50,0.30) 0%, transparent 60%)' }} />
      <Navbar />
      <main className="relative z-10 flex flex-col w-full">
        <motion.div {...fadeUpVariant}>
          <HeroSection />
        </motion.div>

        <motion.div {...fadeUpVariant}>
          <ExperienceSection />
        </motion.div>

        <motion.div {...fadeUpVariant}>
          <EvolutionSection />
        </motion.div>

        {/* <motion.div {...fadeUpVariant}><PlatformsSection /></motion.div> */}

        <motion.div {...fadeUpVariant}>
          <NichesSection />
        </motion.div>

        <motion.div {...fadeUpVariant}>
          <WhatYouCanListSection />
        </motion.div>

        <motion.div {...fadeUpVariant}>
          <HowItWorksSection />
        </motion.div>

        <motion.div {...fadeUpVariant}>
          <RisingCreatorsSection />
        </motion.div>

        <motion.div {...fadeUpVariant}>
          <RevenueModelSection />
        </motion.div>

        <motion.div {...fadeUpVariant}>
          <WaitlistSection />
        </motion.div>

        {/* ── HIGH-CONVERTING REACH US REDIRECT CTA SECTION FROM CONTENT STRATEGY ── */}
        <motion.section 
          {...fadeUpVariant}
          className="py-32 px-6 bg-transparent select-none relative overflow-hidden flex flex-col font-sans"
        >
          <div className="max-w-4xl mx-auto bg-zinc-900/30 backdrop-blur-xl p-10 md:p-16 border border-white/5 hover:border-pink-500/20 transition-all duration-700 rounded-[40px] text-center space-y-8 relative overflow-hidden group">
            {/* Soft pink top-right gradient glow inside the card */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-20 bg-gradient-to-tr from-transparent via-transparent to-[#ec4899] blur-2xl" />

            {/* Pill Tag */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900/60 backdrop-blur-md border border-white/10 text-white/70 text-[10px] font-mono uppercase tracking-[0.2em] relative z-10 mx-auto">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
              JOIN THE ELITE INNER CIRCLE
            </div>

            {/* Main Title */}
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-black leading-[1.1] tracking-tight text-white relative z-10">
              Ready to be part of <br />
              <span
                style={{
                  background: 'linear-gradient(90deg, #8b5cf6 0%, #ec4899 50%, #ff1f4b 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                the evolution?
              </span>
            </h2>

            {/* Subtext */}
            <p className="text-sm md:text-base text-white/50 leading-relaxed font-light font-sans max-w-xl mx-auto relative z-10">
              Unlock access to tailored distribution storefronts, top-tier creator networks, and hyper-targeted digital products. Reach out to us today.
            </p>

            {/* CTA Button that redirects to the reach-us page */}
            <div className="pt-4 flex justify-center relative z-10">
              <Link
                href="/reach-us"
                className="group px-8 py-4 bg-white hover:bg-gradient-to-r hover:from-indigo-500 hover:to-pink-500 hover:text-white text-zinc-950 font-mono font-bold text-xs uppercase tracking-widest rounded-full shadow-lg transition-all duration-500 hover:scale-[1.03] flex items-center justify-center gap-2.5 select-none"
              >
                <span>Get In Touch</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </motion.section>
      </main>
      <Footer />
    </div>
  )
}
