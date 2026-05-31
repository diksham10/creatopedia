import Link from 'next/link'
import { apiFetchServer } from '@/lib/api/server'
import type { Prompt, Creator, Category } from '@/types'

export const revalidate = 60

interface PromptWithDetails extends Prompt {
  creators: Pick<Creator, 'name' | 'handle' | 'subdomain'>
  categories: Pick<Category, 'name' | 'icon'>
}

export default async function BrowsePage() {
  const promptsRes = await apiFetchServer<any>(
    '/prompts?status=published'
  )
  const prompts = Array.isArray(promptsRes) ? promptsRes : (promptsRes?.items || [])

  return (
    <main className="min-h-screen bg-zinc-950 text-white pt-32 pb-20 px-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-16 space-y-4">
          <h1 className="text-4xl md:text-6xl font-black tracking-tight">Browse All <span className="text-indigo-500">Prompts</span></h1>
          <p className="text-zinc-500 text-lg max-w-2xl font-medium">Explore our entire collection of community-verified AI prompts for the next generation of content.</p>
        </header>

        {prompts && prompts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {prompts.map((p) => (
              <div key={p.id} className="group rounded-[2rem] border border-zinc-800 bg-zinc-900/40 hover:border-zinc-600 transition-all duration-300 hover:-translate-y-2 overflow-hidden shadow-2xl">
                <div className="aspect-[4/3] relative bg-zinc-800 flex items-center justify-center overflow-hidden">
                  {p.thumbnail_url ? (
                    <img src={p.thumbnail_url} alt={p.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  ) : (
                    <div className="text-6xl opacity-20">{p.categories?.icon || '🎬'}</div>
                  )}
                  {(p.video_url || p.embed_html) && (
                    <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-black/60 backdrop-blur-md rounded-full px-3 py-1.5 border border-white/10">
                      <div className="w-1.5 h-1.5 bg-pink-500 rounded-full animate-pulse" />
                      <span className="text-[10px] text-white font-black uppercase tracking-widest">Reel</span>
                    </div>
                  )}
                </div>

                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{p.categories?.name}</span>
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">by {p.creators?.subdomain}</span>
                  </div>
                  <h3 className="text-lg font-bold text-white leading-tight h-12 line-clamp-2">{p.title}</h3>
                  <Link href={`/${p.creators?.subdomain}/${p.slug}`} className="block w-full text-center rounded-2xl py-4 text-xs font-black uppercase tracking-widest text-white bg-zinc-800 hover:bg-white hover:text-black transition-all duration-300">
                    View Breakdown →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-zinc-900/20 rounded-[3rem] border border-dashed border-zinc-800 text-zinc-500 font-medium">
            No prompts found. Check back soon!
          </div>
        )}
      </div>
    </main>
  )
}
