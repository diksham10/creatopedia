'use client'

import { useState } from 'react'
import { apiFetch } from '@/lib/api/client'
import Link from 'next/link'

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [handle, setHandle] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleHandleChange = (val: string) => {
    // Sanitize handle to lowercase alphanumeric, dash, and underscore
    const sanitized = val.toLowerCase().replace(/[^a-z0-9-_]/g, '')
    setHandle(sanitized)
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    if (!handle) {
      setError('Please provide a valid handle')
      setLoading(false)
      return
    }

    try {
      await apiFetch<{ access_token: string; refresh_token: string }>(
        '/auth/register',
        {
          method: 'POST',
          body: JSON.stringify({ name, email, handle, password }),
          skipAuthFlow: true,
        }
      )
    } catch (err) {
      let msg = 'Registration failed'
      if (err instanceof Error) {
        try {
          const parsed = JSON.parse(err.message)
          msg = parsed.detail || parsed.message || err.message
        } catch {
          msg = err.message
        }
      }
      setError(msg)
      setLoading(false)
      return
    }

    setLoading(false)

    // The backend already sets auth cookies during registration, so we can
    // navigate straight into the dashboard instead of waiting on a second
    // profile fetch that may race the cookie write.
    // Using window.location ensures we leave the subdomain host (e.g.
    // milan.localhost:3000) and land on the correct admin origin
    // (localhost:3000/dashboard in dev, creatopedia.tech/dashboard in prod).
    const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN?.replace(/^https?:\/\//, '') || 'creatopedia.tech'
    const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname.endsWith('.localhost'))
    const adminUrl = isLocalhost
      ? `http://localhost:${window.location.port || 3000}/dashboard`
      : `https://${baseDomain}/dashboard`
    window.location.href = adminUrl
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#070913] text-white font-sans antialiased overflow-y-auto relative py-12 px-4">
      {/* Background gradients aligned with landing page theme */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-40 select-none" style={{ background: 'radial-gradient(ellipse 100% 70% at 50% 0%, rgba(28,55,170,0.35) 0%, transparent 55%), radial-gradient(ellipse 60% 50% at 100% 100%, rgba(155,15,50,0.30) 0%, transparent 60%)' }} />

      <Link href="/" className="flex items-center gap-1.5 mb-8 group select-none relative z-10">
        <span className="text-3xl font-serif font-bold text-white tracking-tight group-hover:text-white/90 transition-colors">
          Creato
        </span>
        <span
          className="text-3xl font-bold tracking-tight transition-all duration-300 group-hover:brightness-110"
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

      <form 
        onSubmit={handleRegister} 
        className="bg-zinc-900/30 backdrop-blur-xl border border-white/5 rounded-3xl p-8 w-full max-w-sm space-y-6 shadow-2xl relative z-10 group hover:border-pink-500/20 transition-all duration-500 select-none"
      >
        <div className="absolute inset-0 z-0 pointer-events-none opacity-10 bg-gradient-to-tr from-transparent via-transparent to-[#ec4899] blur-xl rounded-3xl" />

        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900/60 backdrop-blur-md border border-white/10 text-white/70 text-[8px] font-mono uppercase tracking-[0.15em]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            CREATE ACCOUNT
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight pt-1">Get started</h1>
          <p className="text-white/45 text-xs font-light">Create a creator profile to access your admin dashboard</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3.5 rounded-2xl relative z-10 font-mono tracking-wide">
            {error}
          </div>
        )}

        <div className="space-y-4 relative z-10">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-white/50 uppercase tracking-wider ml-1">Name</label>
            <input 
              type="text" 
              placeholder="Your Full Name" 
              value={name} 
              onChange={e => setName(e.target.value)}
              className="w-full px-4 py-3.5 rounded-2xl bg-zinc-900/40 border border-white/10 hover:border-white/20 focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 text-sm text-white transition-all placeholder-white/25 font-light" 
              required 
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-semibold text-white/50 uppercase tracking-wider ml-1">Email</label>
            <input 
              type="email" 
              placeholder="name@example.com" 
              value={email} 
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3.5 rounded-2xl bg-zinc-900/40 border border-white/10 hover:border-white/20 focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 text-sm text-white transition-all placeholder-white/25 font-light" 
              required 
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-white/50 uppercase tracking-wider ml-1">Handle / Subdomain</label>
            <div className="relative">
              <input 
                type="text" 
                placeholder="yourhandle" 
                value={handle} 
                onChange={e => handleHandleChange(e.target.value)}
                className="w-full px-4 py-3.5 rounded-2xl bg-zinc-900/40 border border-white/10 hover:border-white/20 focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 text-sm text-white transition-all placeholder-white/25 font-light" 
                required 
              />
            </div>
            <p className="text-[10px] text-white/40 ml-1 font-light">
              This will also be your subdomain (e.g., {handle || 'handle'}.creatopedia.tech)
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-white/50 uppercase tracking-wider ml-1">Password</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={password} 
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3.5 rounded-2xl bg-zinc-900/40 border border-white/10 hover:border-white/20 focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 text-sm text-white transition-all placeholder-white/25 font-light" 
              required 
            />
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full py-4 rounded-full bg-white hover:bg-gradient-to-r hover:from-indigo-500 hover:to-pink-500 hover:text-white text-zinc-950 font-mono font-bold text-xs uppercase tracking-widest shadow-lg transition-all duration-500 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center relative z-10 select-none"
        >
          {loading ? 'Creating Account…' : 'Sign Up'}
        </button>

        <p className="text-center text-white/50 text-xs relative z-10 font-light select-none">
          Already have an account?{' '}
          <Link href="/login" className="text-white hover:text-indigo-400 font-medium underline underline-offset-4 decoration-white/15 transition-all">
            Sign In
          </Link>
        </p>

        <p className="text-center text-white/35 text-[11px] relative z-10 font-light select-none">
          By signing up, you agree to our <Link href="/terms" className="text-white/60 hover:text-white underline underline-offset-4 decoration-white/15 transition-all">Terms of Service</Link>
        </p>
      </form>
    </div>
  )
}
