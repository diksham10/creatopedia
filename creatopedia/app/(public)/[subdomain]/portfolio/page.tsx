'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import SubdomainViewTracker from '@/components/public/SubdomainViewTracker'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Sparkles,
  Layers,
  TrendingUp,
  Award,
  CheckCircle2,
  ArrowLeft,
  MessageSquare,
  Globe,
  Mail,
  Zap,
  Target,
  Rocket,
  Shield,
  ChevronRight,
  Filter
} from 'lucide-react'

// Constants for Work Items
const CATEGORIES = ['All', 'AI Art & Midjourney', 'Claude Workflows', 'GPT Automation']

const WORK_ITEMS = [
  {
    title: 'Surrealist Neon Architecture',
    category: 'AI Art & Midjourney',
    desc: 'A premium Midjourney prompt system generating cinematic, photorealistic cyberpunk architecture with precise control over neon lighting and reflections.',
    image: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=800&q=80',
    tags: ['Midjourney v6', 'Reflections', 'Cinematic']
  },
  {
    title: 'Cognitive Code Reviewer Agent',
    category: 'Claude Workflows',
    desc: 'A multi-agent prompt workflow for Claude 3.5 Sonnet that conducts automated security, logic, and optimization reviews for React and Node.js applications.',
    image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80',
    tags: ['Claude 3.5', 'JSON Schema', 'Multi-Agent']
  },
  {
    title: 'SEO Content Expansion System',
    category: 'GPT Automation',
    desc: 'An automated prompt chain that parses user transcripts, constructs detailed topical maps, and generates optimized SEO-rich long-form articles without losing human tone.',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
    tags: ['ChatGPT-4o', 'SEO Chains', 'JSON Mode']
  },
  {
    title: 'Biophilic Interior Concepts',
    category: 'AI Art & Midjourney',
    desc: 'Architectural prompt sets merging natural flora with ultra-modern interior designs, tuned for commercial presentation decks and real-estate visualizations.',
    image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80',
    tags: ['Midjourney v6', 'Interior', 'Biophilic']
  },
  {
    title: 'Customer Success Response Engine',
    category: 'Claude Workflows',
    desc: 'An advanced system for support teams that analyzes ticket tone, context, and historic resolution data to instantly drafts hyper-personalized responses.',
    image: 'https://images.unsplash.com/photo-1552581230-c01bc0d48403?auto=format&fit=crop&w=800&q=80',
    tags: ['Claude 3.5', 'Tone Control', 'Workflows']
  },
  {
    title: 'Interactive Math Tutor Prompt',
    category: 'GPT Automation',
    desc: 'A pedagogical prompt designed to guide students through calculus step-by-step using first-principles questioning rather than simply giving away answers.',
    image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=800&q=80',
    tags: ['ChatGPT-4o', 'Socratic', 'Education']
  }
]

const VALUE_PROPS = [
  {
    icon: Target,
    title: 'Hyper-Targeted Outputs',
    desc: 'Eliminate randomness and model hallucinations. Get consistent, production-grade outputs from every single run with battle-tested prompt systems.'
  },
  {
    icon: Zap,
    title: '85% Workflow Optimization',
    desc: 'Automate content generation, code drafting, and customer workflows. Save hundreds of manual hours weekly by deploying custom integrated AI templates.'
  },
  {
    icon: Shield,
    title: 'Enterprise-Grade Scale',
    desc: 'AI architectures that scale from solo creators to entire design agencies seamlessly, maintaining rigorous standards and brand voice throughout.'
  }
]

const TESTIMONIALS = [
  {
    quote: "Milan is hands-down the best AI prompt engineer we have ever worked with. His Midjourney systems saved our creative team over 30 hours per week and unlocked an entirely new aesthetic.",
    author: "Elena Rostova",
    role: "VP of Design, StudioX",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80"
  },
  {
    quote: "The Claude multi-agent workflows Milan built for our customer success team have been a complete game changer. Response accuracy went up 40% while resolution times plummeted.",
    author: "James Carter",
    role: "Director of Product, OptimaSaaS",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80"
  },
  {
    quote: "Milan's SEO automation chains allowed us to scale our organic reach by 12x in less than 3 months. The quality of the content is so good that it is indistinguishable from human writers.",
    author: "Marcus Vance",
    role: "Founder, GrowthEngine",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80"
  }
]

const BRANDS = [
  { name: 'OpenAI', logo: 'https://upload.wikimedia.org/wikipedia/commons/4/4d/OpenAI_Logo.svg' },
  { name: 'Anthropic', logo: 'https://upload.wikimedia.org/wikipedia/commons/e/e1/Anthropic_logo.svg' },
  { name: 'Midjourney', logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=80&q=80' }, // placeholder/styled icon fallback
  { name: 'Zapier', logo: 'https://upload.wikimedia.org/wikipedia/commons/a/ad/Zapier_logo.svg' },
  { name: 'Notion', logo: 'https://upload.wikimedia.org/wikipedia/commons/e/e9/Notion-logo.svg' }
]

const fadeUpVariant = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-100px' },
  transition: { duration: 0.8 }
}

export default function CreatorPortfolioPage() {
  const params = useParams()
  const subdomain = params?.subdomain as string || 'milan'
  const [activeCategory, setActiveCategory] = useState('All')
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' })
  const [formSubmitted, setFormSubmitted] = useState(false)

  const filteredWorks = WORK_ITEMS.filter(
    (item) => activeCategory === 'All' || item.category === activeCategory
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!contactForm.name || !contactForm.email || !contactForm.message) return
    setFormSubmitted(true)
    setTimeout(() => {
      setContactForm({ name: '', email: '', message: '' })
      setFormSubmitted(false)
    }, 4000)
  }

  const handleBackToStore = () => {
    if (typeof window !== 'undefined') {
      window.location.href = `/${subdomain}`
    }
  }

  return (
    <div className="min-h-screen bg-[#070913] text-white selection:bg-pink-500/30 font-sans antialiased overflow-x-hidden relative">
      <SubdomainViewTracker subdomain={subdomain} />
      {/* ─── STUNNING BACKGROUND RADIAL GLOWS ─── */}
      <div
        className="absolute inset-0 z-0 pointer-events-none opacity-40 select-none"
        style={{
          background: `
            radial-gradient(ellipse 100% 70% at 50% 0%, rgba(28,55,170,0.35) 0%, transparent 55%), 
            radial-gradient(ellipse 60% 50% at 100% 100%, rgba(155,15,50,0.30) 0%, transparent 60%),
            radial-gradient(circle at 10% 40%, rgba(139,92,246,0.15) 0%, transparent 50%)
          `
        }}
      />

      {/* ─── BLENDED NAVIGATION BAR ─── */}
      <nav className="fixed top-0 z-50 w-full px-8 py-6 transition-all duration-300">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <span className="text-xl font-medium tracking-tight text-white/90">
              {subdomain.charAt(0).toUpperCase() + subdomain.slice(1)} Studio
            </span>
          </div>

          {/* Center Links */}
          <div className="hidden md:flex items-center gap-8 text-[11px] font-medium uppercase tracking-[0.2em] text-white/50">
            <a href="#" className="hover:text-white transition-colors">Home</a>
            <a href="#about" className="hover:text-white transition-colors">About</a>
            <a href="#services" className="hover:text-white transition-colors">Services</a>
            <a href="#works" className="hover:text-white transition-colors text-white">Work</a>
            <a href="#insights" className="hover:text-white transition-colors">Insights</a>
            <a href="#contact" className="hover:text-white transition-colors">Contact</a>
          </div>

          {/* Right Icons */}
          <div className="flex items-center gap-4">
            <button className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </button>
            <button className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </button>
          </div>
        </div>
      </nav>

      {/* ─── HERO SECTION (Lumora Studio Replica Design) ─── */}
      <header
        id="hero"
        className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#070913]"
      >
        {/* Deep rich dark background */}
        <div className="absolute inset-0 bg-[#070913] z-0" />

        {/* Red and Blue Theme Gradient (requested) */}
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            background: `
              radial-gradient(circle at 10% 40%, rgba(220, 38, 38, 0.15) 0%, transparent 40%),
              radial-gradient(circle at 5% 60%, rgba(37, 99, 235, 0.12) 0%, transparent 35%),
              radial-gradient(circle at 25% 45%, rgba(249,115,22,0.15) 0%, transparent 60%)
            `,
          }}
        />

        {/* Main Content Grid */}
        <div className="relative z-10 max-w-7xl mx-auto w-full px-6 lg:px-12 py-24 lg:py-0">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center min-h-[80vh]">

            {/* Left Column: Socials + Portrait */}
            <div className="lg:col-span-6 flex items-center gap-6 lg:gap-10 relative">
              {/* Circular Social Icons in Flex Col */}
              <div className="flex flex-col gap-5 text-white/40 shrink-0">
                <a href="#" className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all duration-300">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                </a>
                <a href="#" className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all duration-300">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z"/></svg>
                </a>
                <a href="#" className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all duration-300">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                </a>
              </div>

              {/* Portrait Container with Warm Backdrop Glow */}
              <div className="relative w-full max-w-[420px] aspect-[4/5] rounded-[36px] overflow-hidden border border-white/5 shadow-2xl group">
                <motion.div
                  initial={{ scale: 1.03, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 1 }}
                  className="w-full h-full"
                >
                  <img
                    src="https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=800&q=80"
                    alt={subdomain}
                    className="w-full h-full object-cover select-none transition-transform duration-700 group-hover:scale-105"
                    style={{
                      objectPosition: 'center 20%',
                    }}
                  />
                </motion.div>
                
                {/* Dark shading overlay inside portrait */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#070913]/30 via-transparent to-transparent pointer-events-none" />

                {/* 35+ Creative Projects Frosted Badge Overlay */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                  className="absolute bottom-6 left-6 right-6 backdrop-blur-md bg-[#131520]/60 border border-white/10 px-6 py-4 rounded-2xl flex items-center gap-4 select-none shadow-xl"
                >
                  <span className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white font-sans">
                    35+
                  </span>
                  <div className="flex flex-col">
                    <span className="text-white/85 text-[10px] font-mono tracking-wide uppercase leading-tight">
                      creative projects
                    </span>
                    <span className="text-white/40 text-[9px] font-mono tracking-widest uppercase leading-tight mt-0.5">
                      delivered
                    </span>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Right Column: Text & Call to Action */}
            <div className="lg:col-span-6 flex flex-col justify-center space-y-8 lg:pl-6 text-left">
              {/* Brand Label/Pill */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center gap-2.5"
              >
                <div className="w-5 h-5 rounded-full bg-[#f97316] flex items-center justify-center text-[9px] font-bold text-white shadow-lg shadow-orange-500/20">
                  ★
                </div>
                <span className="text-xs font-semibold tracking-widest uppercase font-mono text-white/90">
                  {subdomain.toUpperCase()} STUDIO
                </span>
              </motion.div>

              {/* Huge Premium Headline */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.15 }}
                className="text-4xl md:text-5xl lg:text-[54px] font-extrabold tracking-tight text-white leading-[1.12] font-sans"
              >
                Hello, I Craft <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-200 to-white">
                  Meaningful Brand
                </span> <br />
                Experiences
              </motion.h1>

              {/* Description Paragraph */}
              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="text-white/60 text-sm md:text-base leading-relaxed font-light max-w-xl"
              >
                I&apos;m a multidisciplinary creative focused on building custom AI prompt architectures and brand voice systems that feel authentic, strategic, and unforgettable across every touchpoint.
              </motion.p>

              {/* Call to Actions & Contact Info */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="flex flex-wrap items-center gap-5 pt-4"
              >
                {/* Main CTA Pill Button */}
                <a
                  href="#contact"
                  className="group inline-flex items-center justify-between gap-5 px-6 py-3.5 bg-[#f97316] hover:bg-white text-zinc-950 font-semibold text-xs rounded-full shadow-xl transition-all duration-300"
                >
                  <span className="group-hover:text-zinc-950 text-white font-mono uppercase tracking-wider">
                    Let&apos;s Work Together
                  </span>
                  <div className="w-5 h-5 rounded-full bg-zinc-950/10 group-hover:bg-zinc-950/20 flex items-center justify-center transition-colors">
                    <ArrowRight className="w-3.5 h-3.5 text-white group-hover:text-zinc-950" />
                  </div>
                </a>

                {/* Vertical Separator */}
                <div className="hidden sm:block h-8 w-px bg-white/10 mx-2" />

                {/* Contact Info */}
                <div className="flex flex-col text-left">
                  <a href={`mailto:${subdomain}.studio@gmail.com`} className="text-white/65 hover:text-white text-xs font-mono tracking-wide transition-colors">
                    {subdomain}.studio@gmail.com
                  </a>
                  <span className="text-white/30 text-[10px] font-mono tracking-widest uppercase mt-0.5">
                    +1212 09874 7635 0938
                  </span>
                </div>
              </motion.div>
            </div>

          </div>
        </div>
      </header>

      {/* ─── JOURNEY SECTION (VERTICAL 1 2 3) ─── */}
      <section id="about" className="py-32 px-6 bg-transparent relative overflow-hidden group select-none">
        <div
          className="absolute inset-0 z-0 pointer-events-none opacity-40 group-hover:opacity-60 transition-opacity duration-700"
          style={{
            background: `
              radial-gradient(ellipse 100% 70% at 50% -5%, rgba(28,55,170,0.45) 0%, transparent 60%),
              radial-gradient(ellipse 60% 50% at 102% 105%, rgba(155,15,50,0.40) 0%, transparent 60%)
            `
          }}
        />

        <div className="max-w-4xl mx-auto text-center space-y-4 mb-24 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#111520]/80 border border-white/10 text-[#ff1f4b] text-[10px] font-mono uppercase tracking-[0.2em]">
            <span>✦</span> HISTORIC LOGS
          </div>
          <h2 className="text-4xl sm:text-5xl font-black leading-tight text-white tracking-tight">
            The Journey of Milan
          </h2>
          <p className="text-md font-light text-white/55 font-sans max-w-md mx-auto leading-relaxed">
            From exploring complex GPT model structures to custom digital storefront designs.
          </p>
        </div>

        <div className="max-w-4xl mx-auto relative space-y-24 z-10">
          {/* Vertical Timeline center line */}
          <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 bg-white/10 w-[1px] -z-10" />

          {[
            {
              chapter: 'Chapter I (2022)',
              title: 'The AI Genesis & Discovery',
              desc: 'Pioneered custom prompt structures during the early releases of GPT-3 and Midjourney v3. Discovered how nuanced syntactic structures impact neural net outputs, building private libraries for designers.',
              align: 'right',
              number: '1'
            },
            {
              chapter: 'Chapter II (2023)',
              title: 'Empowering Elite Creators & Teams',
              desc: 'Deployed high-performance prompt workflows and multi-agent systems for over 20+ design studios and digital agencies. Optimized content pipelines to slash turnaround times by up to 85%.',
              align: 'left',
              number: '2'
            },
            {
              chapter: 'Chapter III (2024 - Present)',
              title: 'Creatopedia Direct Storefront',
              desc: 'Launched an exclusive high-performance prompt storefront on Creatopedia to distribute production-ready prompt packs and automated workflows directly to thousands of creative engineers.',
              align: 'right',
              number: '3'
            }
          ].map((item, idx) => (
            <div key={idx} className={`flex flex-col md:flex-row items-center gap-8 md:gap-16 w-full relative ${item.align === 'left' ? 'md:flex-row-reverse' : ''}`}>
              <div className="flex-1 hidden md:block" />
              <div className="w-10 h-10 rounded-full border border-[#ff1f4b]/40 bg-black flex items-center justify-center flex-shrink-0 z-20 md:absolute md:left-1/2 md:-translate-x-1/2">
                <span className="w-2 h-2 rounded-full bg-[#ff1f4b] animate-pulse"></span>
              </div>
              <div className={`flex-1 bg-[#111520]/70 backdrop-blur-sm p-8 border border-white/10 rounded-2xl space-y-3 hover:scale-[1.02] transition-all duration-500 text-left w-full hover:border-[#ff1f4b]/30 relative overflow-hidden select-none ${item.align === 'right' ? 'md:ml-12' : 'md:mr-12'}`}>
                <span className="font-mono text-[10px] text-[#ff1f4b] uppercase tracking-wider font-bold mb-3 block">{item.chapter}</span>
                <h3 className="text-xl font-black text-white leading-tight pr-12">{item.title}</h3>
                <p className="text-sm font-sans text-white/55 leading-relaxed font-light">{item.desc}</p>
                <span className="absolute top-2 right-4 text-[100px] leading-none font-black text-white/5 font-sans pointer-events-none">
                  {item.number}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── RECENT WORKS (WORK SECTION WITH CATEGORY FILTER) ─── */}
      <section id="works" className="py-32 px-6 bg-transparent relative overflow-hidden select-none">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#111520]/80 border border-white/10 text-[#ff1f4b] text-[10px] font-mono uppercase tracking-[0.2em]">
                <Filter className="w-3 h-3 text-[#ff1f4b]" /> PORTFOLIO SHOWCASE
              </div>
              <h2 className="text-4xl sm:text-5xl font-black leading-tight text-white tracking-tight">
                Recent AI Creations
              </h2>
            </div>
            <p className="text-xs text-white/45 font-light max-w-sm font-sans leading-relaxed">
              Explore production-grade prompts, advanced workflows, and visual design structures created specifically for modern creators.
            </p>
          </div>

          {/* Categories Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-4">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-5 py-2.5 rounded-full text-xs font-mono tracking-wider transition-all duration-300 border ${activeCategory === cat
                    ? 'bg-[#ff1f4b]/10 border-[#ff1f4b]/50 text-[#ff1f4b] font-bold'
                    : 'bg-zinc-900/40 border-white/5 text-white/50 hover:text-white hover:border-white/15'
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Work Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredWorks.map((item, idx) => (
              <div
                key={idx}
                className="group bg-[#111520]/50 backdrop-blur-md border border-white/5 hover:border-[#ff1f4b]/30 rounded-3xl overflow-hidden flex flex-col justify-between h-[450px] transition-all duration-500 hover:scale-[1.02]"
              >
                <div className="space-y-6">
                  {/* Image container */}
                  <div className="h-48 w-full overflow-hidden relative">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-80 group-hover:opacity-100"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#111520] to-transparent" />
                    <span className="absolute top-4 left-4 inline-flex items-center text-[9px] font-mono uppercase tracking-widest px-2.5 py-1 rounded-full bg-zinc-950/80 border border-white/10 text-white/90 backdrop-blur-md">
                      {item.category}
                    </span>
                  </div>

                  <div className="px-6 space-y-3">
                    <h3 className="text-xl font-black text-white group-hover:text-[#ff1f4b] transition-colors line-clamp-1">{item.title}</h3>
                    <p className="text-xs text-white/50 leading-relaxed font-sans line-clamp-3">{item.desc}</p>
                  </div>
                </div>

                <div className="p-6 border-t border-white/5 flex flex-wrap gap-1.5">
                  {item.tags.map((t, i) => (
                    <span key={i} className="text-[8px] font-mono uppercase tracking-widest px-2.5 py-1 rounded-md bg-white/5 text-white/50 border border-white/5">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── VALUE PROPOSITIONS CARDS SECTION ─── */}
      <section id="value" className="py-32 px-6 bg-transparent relative overflow-hidden select-none">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#111520]/80 border border-white/10 text-[#ff1f4b] text-[10px] font-mono uppercase tracking-[0.2em]">
              <span>✦</span> VALUE PROPOSITIONS
            </div>
            <h2 className="text-4xl sm:text-5xl font-black leading-tight text-white tracking-tight">
              Engineered for Maximum Impact
            </h2>
            <p className="text-sm font-light text-white/45 max-w-md mx-auto leading-relaxed">
              Why elite creators and business teams rely on Milan’s custom AI systems.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {VALUE_PROPS.map((prop, idx) => {
              const PropIcon = prop.icon
              return (
                <div
                  key={idx}
                  className="group bg-[#111520]/60 backdrop-blur-md p-10 border border-white/10 rounded-[32px] hover:scale-[1.03] transition-all duration-500 relative flex flex-col justify-between h-[320px] select-none"
                >
                  <div className="space-y-6">
                    <div className="w-14 h-14 rounded-2xl bg-[#ff1f4b]/10 border border-[#ff1f4b]/20 flex items-center justify-center text-[#ff1f4b] transition-all duration-500">
                      <PropIcon className="w-6 h-6 transition-transform group-hover:scale-110" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white leading-tight tracking-wide">{prop.title}</h3>
                      <p className="text-xs font-sans text-white/45 mt-3 leading-relaxed font-light">{prop.desc}</p>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-white/5 text-[10px] font-mono font-bold uppercase tracking-widest text-[#ff1f4b]/60 flex items-center gap-1">
                    <span>Precision system</span> <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIAL SECTION ─── */}
      <section id="testimonials" className="py-32 px-6 bg-transparent relative overflow-hidden select-none">
        <div className="max-w-6xl mx-auto space-y-16">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#111520]/80 border border-white/10 text-[#ff1f4b] text-[10px] font-mono uppercase tracking-[0.2em]">
              <MessageSquare className="w-3.5 h-3.5 text-[#ff1f4b]" /> RECOMMENDATIONS
            </div>
            <h2 className="text-4xl sm:text-5xl font-black leading-tight text-white tracking-tight">
              What Partners Say
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((t, idx) => (
              <div key={idx} className="bg-zinc-900/30 backdrop-blur-xl p-8 md:p-10 border border-white/5 hover:border-pink-500/20 transition-all duration-500 rounded-3xl flex flex-col justify-between space-y-8 relative overflow-hidden group">
                <div className="absolute inset-0 pointer-events-none opacity-10 bg-gradient-to-tr from-transparent to-[#ec4899] blur-2xl" />

                <p className="text-xs sm:text-sm text-white/70 italic leading-relaxed font-light relative z-10">&ldquo;{t.quote}&rdquo;</p>

                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-12 h-12 rounded-full overflow-hidden border border-white/10">
                    <img src={t.avatar} alt={t.author} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white">{t.author}</h4>
                    <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest mt-0.5">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── BRAND LOGO CAROUSEL ─── */}
      <section id="brands" className="py-24 border-y border-white/5 bg-[#0a0c16]/30 select-none overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-6 mb-8 text-center">
          <span className="text-[10px] font-mono text-white/30 uppercase tracking-[0.3em]">trusted by industry pioneers</span>
        </div>
        <div className="w-full flex overflow-hidden">
          {/* Infinite Moving Marquee Container */}
          <div className="flex gap-20 py-2 items-center animate-[marquee_25s_linear_infinite] whitespace-nowrap min-w-full">
            {BRANDS.concat(BRANDS).map((brand, idx) => (
              <div key={idx} className="flex items-center gap-3 opacity-30 hover:opacity-60 transition-opacity duration-300">
                <span className="text-white font-mono font-bold tracking-widest text-lg uppercase">{brand.name}</span>
                <span className="text-[#ff1f4b] text-xs">✦</span>
              </div>
            ))}
          </div>
        </div>
        <style jsx global>{`
          @keyframes marquee {
            0% { transform: translateX(0%); }
            100% { transform: translateX(-50%); }
          }
        `}</style>
      </section>

      {/* ─── TALK WITH ME CTA / CONTACT ─── */}
      <section id="contact" className="py-32 px-6 bg-transparent relative overflow-hidden select-none">
        <div className="max-w-4xl mx-auto bg-zinc-900/30 backdrop-blur-xl p-10 md:p-16 border border-white/5 hover:border-[#ff1f4b]/20 transition-all duration-700 rounded-[40px] relative overflow-hidden group">
          <div className="absolute inset-0 z-0 pointer-events-none opacity-20 bg-gradient-to-tr from-transparent via-transparent to-[#ff1f4b] blur-2xl" />

          <div className="max-w-2xl mx-auto text-center space-y-6 relative z-10 mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-900/60 backdrop-blur-md border border-white/10 text-white/70 text-[10px] font-mono uppercase tracking-[0.2em] mx-auto">
              <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse" />
              LET&apos;S BUILD THE FUTURE
            </div>
            <h2 className="text-4xl sm:text-5xl font-black leading-tight text-white tracking-tight">
              Ready to collaborate?
            </h2>
            <p className="text-xs sm:text-sm text-white/50 leading-relaxed font-light max-w-lg mx-auto">
              Reach out for enterprise prompt engineering consulting, custom agent workflows, or creative media partnerships. Let&apos;s build together.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="max-w-xl mx-auto space-y-5 relative z-10">
            {formSubmitted ? (
              <div className="p-6 bg-[#ff1f4b]/10 border border-[#ff1f4b]/30 rounded-2xl text-center space-y-2 animate-in fade-in scale-in duration-500">
                <CheckCircle2 className="w-8 h-8 text-[#ff1f4b] mx-auto animate-bounce" />
                <h4 className="text-lg font-bold text-white">Message Logged!</h4>
                <p className="text-xs text-white/55 font-light">Thank you, Milan will get back to you shortly.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2 text-left">
                    <label className="text-[10px] font-mono uppercase tracking-widest text-white/40 ml-1">Name</label>
                    <input
                      type="text"
                      required
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      className="w-full px-5 py-3.5 bg-zinc-950/60 border border-white/5 focus:border-[#ff1f4b]/40 rounded-xl text-xs text-white placeholder-white/20 focus:outline-none transition-colors"
                      placeholder="Jane Doe"
                    />
                  </div>
                  <div className="space-y-2 text-left">
                    <label className="text-[10px] font-mono uppercase tracking-widest text-white/40 ml-1">Email</label>
                    <input
                      type="email"
                      required
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      className="w-full px-5 py-3.5 bg-zinc-950/60 border border-white/5 focus:border-[#ff1f4b]/40 rounded-xl text-xs text-white placeholder-white/20 focus:outline-none transition-colors"
                      placeholder="jane@example.com"
                    />
                  </div>
                </div>

                <div className="space-y-2 text-left">
                  <label className="text-[10px] font-mono uppercase tracking-widest text-white/40 ml-1">Message</label>
                  <textarea
                    required
                    rows={4}
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    className="w-full px-5 py-3.5 bg-zinc-950/60 border border-white/5 focus:border-[#ff1f4b]/40 rounded-xl text-xs text-white placeholder-white/20 focus:outline-none transition-colors resize-none"
                    placeholder="Tell me about your project or consultation needs..."
                  />
                </div>

                <div className="pt-4 flex justify-center">
                  <button
                    type="submit"
                    className="group px-8 py-4 bg-white hover:bg-[#ff1f4b] hover:text-white text-zinc-950 font-mono font-bold text-xs uppercase tracking-widest rounded-full shadow-lg transition-all duration-500 hover:scale-[1.03] flex items-center justify-center gap-2.5 select-none w-full"
                  >
                    <span>Send Message</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              </>
            )}
          </form>

          {/* Social Icons inside Contact */}
          <div className="flex justify-center gap-6 mt-12 pt-12 border-t border-white/5 relative z-10">
            <a href="https://instagram.com/milan_designs" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-[#ff1f4b] transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
              </svg>
            </a>
            <a href="https://twitter.com/milan_designs" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-blue-400 transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-blue-500 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                <rect width="4" height="12" x="2" y="9" />
                <circle cx="4" cy="4" r="2" />
              </svg>
            </a>
            <a href="mailto:milan@creatopedia.tech" className="text-white/40 hover:text-emerald-400 transition-colors">
              <Mail className="w-5 h-5" />
            </a>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="py-12 border-t border-white/5 bg-[#070913]/80 relative z-10 text-center text-white/30 space-y-4">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm tracking-widest text-white font-bold">MILAN RAYAMAJHI</span>
            <span className="text-pink-500 text-xs">✦</span>
          </div>
          <p className="text-xs font-mono">
            &copy; {new Date().getFullYear()} Milan Rayamajhi. Powered by Creatopedia. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
