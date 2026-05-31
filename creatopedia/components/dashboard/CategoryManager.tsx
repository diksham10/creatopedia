'use client'

import { useState, useEffect } from 'react'
import type { Category } from '@/types'
import { apiFetch } from '@/lib/api/client'

export default function CategoryManager() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newCat, setNewCat] = useState({ name: '', slug: '', icon: '🎬', description: '', featured: false })

  useEffect(() => {
    fetchCategories()
  }, [])

  const [error, setError] = useState<string | null>(null)

  async function fetchCategories() {
    try {
      const data = await apiFetch<Category[]>('/categories')
      if (Array.isArray(data)) {
        setCategories(data)
        setError(null)
      } else {
        setError('table_missing')
        setCategories([])
      }
    } catch (err) {
      setCategories([])
    } finally {
      setLoading(false)
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await apiFetch('/categories', {
        method: 'POST',
        body: JSON.stringify(newCat),
      })
      setNewCat({ name: '', slug: '', icon: '🎬', description: '', featured: false })
      fetchCategories()
    } catch {}
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure? This may affect prompts in this category.')) return
    try {
      await apiFetch(`/categories/${id}`, { method: 'DELETE' })
      fetchCategories()
    } catch {}
  }

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-10 bg-zinc-800 rounded-xl w-full" /></div>

  if (error === 'table_missing') {
    return (
      <div className="p-10 rounded-[3rem] bg-indigo-500/5 border border-indigo-500/10 text-center space-y-6 animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto text-4xl shadow-2xl shadow-indigo-500/20">🚧</div>
        <div className="space-y-2">
          <h3 className="text-2xl font-black text-white tracking-tight">Database Setup Required</h3>
          <p className="text-zinc-500 text-sm max-w-md mx-auto leading-relaxed">
            The professional <span className="text-indigo-400 font-bold">categories</span> system requires a quick table setup in your database.
          </p>
        </div>
        <div className="bg-zinc-950 p-6 rounded-[2rem] border border-zinc-800 text-left overflow-hidden relative group">
          <div className="absolute top-4 right-4 text-[8px] font-black uppercase tracking-widest text-zinc-600 group-hover:text-indigo-400 transition-colors">SQL Editor</div>
          <pre className="text-[10px] text-zinc-500 font-mono leading-relaxed">
            {`CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  icon TEXT DEFAULT '🎬',
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE prompts 
ADD COLUMN category_id UUID 
REFERENCES categories(id);`}
          </pre>
        </div>
        <button 
          onClick={() => fetchCategories()}
          className="px-10 py-4 bg-indigo-600 text-white font-black rounded-full text-[10px] uppercase tracking-[0.2em] hover:bg-indigo-500 transition-all active:scale-95 shadow-xl shadow-indigo-500/20"
        >
          I&apos;ve run the SQL - Check Again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleAdd} className="bg-zinc-950 p-6 rounded-3xl border border-zinc-800 space-y-4">
        <h3 className="text-white font-bold mb-2">Add New Category</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <input 
            type="text" 
            placeholder="Name (e.g. Education)" 
            value={newCat.name}
            onChange={e => setNewCat({ ...newCat, name: e.target.value, slug: e.target.value.toLowerCase().replace(/ /g, '-') })}
            className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-sm"
          />
          <input 
            type="text" 
            placeholder="Slug" 
            value={newCat.slug}
            readOnly
            className="px-4 py-2 bg-zinc-900/50 border border-zinc-800 rounded-xl text-sm text-zinc-500"
          />
          <input 
            type="text" 
            placeholder="Icon (Emoji)" 
            value={newCat.icon}
            onChange={e => setNewCat({ ...newCat, icon: e.target.value })}
            className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-sm"
          />
          <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl">
            <input 
              type="checkbox" 
              id="cat-featured"
              checked={newCat.featured}
              onChange={e => setNewCat({ ...newCat, featured: e.target.checked })}
              className="accent-indigo-500"
            />
            <label htmlFor="cat-featured" className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Featured</label>
          </div>
          <button 
            type="submit" 
            disabled={saving}
            className="bg-white text-black font-bold rounded-xl text-sm hover:bg-zinc-200"
          >
            {saving ? 'Adding...' : 'Add Category'}
          </button>
        </div>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categories.map(cat => (
          <div key={cat.id} className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{cat.icon}</span>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-white font-bold text-sm">{cat.name}</p>
                  {cat.featured && <span className="text-[8px] bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded-full border border-indigo-500/20 font-black uppercase">Featured</span>}
                </div>
                <p className="text-xs text-zinc-500">/{cat.slug}</p>
              </div>
            </div>
            <button 
              onClick={() => handleDelete(cat.id)}
              className="text-zinc-600 hover:text-red-500 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
