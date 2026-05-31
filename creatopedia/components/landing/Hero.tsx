import Link from 'next/link'

export default function Hero() {
  return (
    <section className="relative pt-32 pb-20 overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-indigo-500/10 blur-[120px] -z-10 rounded-full" />
      
      <div className="max-w-7xl mx-auto px-6 text-center">
        <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-widest px-4 py-2 rounded-full mb-8 animate-in fade-in slide-in-from-top-4 duration-1000">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
          </span>
          Next-Gen Prompt Delivery
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white to-zinc-500">
          Monetize Your AI <br className="hidden md:block" /> Expertise with Style
        </h1>
        
        <p className="max-w-2xl mx-auto text-lg md:text-xl text-zinc-400 leading-relaxed mb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          The all-in-one platform for AI content creators to share, gate, and track their high-performing prompts on custom branded landing pages.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-16">
          <Link
            href="/login"
            className="w-full sm:w-auto rounded-full bg-indigo-600 px-10 py-4 text-lg font-bold text-white shadow-2xl shadow-indigo-500/40 hover:bg-indigo-500 hover:-translate-y-1 transition-all active:scale-95"
          >
            Start Creating Free
          </Link>
          <a
            href="#demo"
            className="w-full sm:w-auto rounded-full bg-zinc-900 border border-zinc-800 px-10 py-4 text-lg font-semibold text-white hover:bg-zinc-800 transition-all active:scale-95"
          >
            Watch Demo
          </a>
        </div>

        {/* Hero Mockup */}
        <div className="relative max-w-5xl mx-auto rounded-3xl border border-zinc-800 bg-zinc-900/50 p-4 shadow-2xl animate-in zoom-in-95 duration-1000 delay-300">
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-indigo-500/20 blur-[60px] -z-10 rounded-full" />
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-indigo-500/20 blur-[60px] -z-10 rounded-full" />
          
          <div className="aspect-[16/9] rounded-2xl bg-zinc-950 overflow-hidden border border-zinc-800 flex items-center justify-center text-zinc-700">
             <div className="flex flex-col items-center gap-4">
                <svg className="w-16 h-16 opacity-20" fill="currentColor" viewBox="0 0 24 24">
                   <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
                <span className="text-sm font-mono uppercase tracking-widest opacity-50">Creator Dashboard Preview</span>
             </div>
          </div>
        </div>
      </div>
    </section>
  )
}
