'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Creator } from '@/types'
import { uploadFile } from '@/lib/api/client'
import InstagramIntegration from './InstagramIntegration'

interface Props {
  defaultValues: Creator
  section: 'profile' | 'integrations'
}

export default function SettingsForm({ defaultValues, section }: Props) {
  const [formData, setFormData] = useState<Partial<Creator>>(defaultValues)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [uploading, setUploading] = useState(false)
  const router = useRouter()

  // Keep state synced with default values when profile is fetched
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFormData(defaultValues)
  }, [defaultValues])

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError(null)

    try {
      const url = await uploadFile(file)
      setFormData(prev => ({ ...prev, avatar_url: url }))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const res = await fetch('/api/creator', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save settings')

      setSuccess(true)
      router.refresh()
      setTimeout(() => setSuccess(false), 3000)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {section === 'profile' && (
        <>
          <div className="flex items-center gap-8 bg-zinc-950 p-6 rounded-3xl border border-zinc-800">
            <div className="relative group">
              <div className="w-20 h-20 rounded-full bg-zinc-800 border-2 border-zinc-700 overflow-hidden">
                {formData.avatar_url ? (
                  <img src={formData.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-600 text-2xl font-bold">
                    {formData.name?.charAt(0)}
                  </div>
                )}
              </div>
              <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full">
                <span className="text-[10px] font-bold text-white uppercase tracking-wider">{uploading ? '...' : 'Change'}</span>
                <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={uploading} />
              </label>
            </div>
            <div className="space-y-1">
              <h3 className="text-white font-bold">{formData.name}</h3>
              <p className="text-zinc-500 text-sm">{formData.handle}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Full Name</label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:ring-2 focus:ring-indigo-500/50 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Handle (Public Username)</label>
              <input
                type="text"
                value={formData.handle || ''}
                onChange={e => setFormData(prev => ({ ...prev, handle: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:ring-2 focus:ring-indigo-500/50 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Subdomain (Discovery URL)</label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.subdomain || ''}
                  onChange={e => setFormData(prev => ({ ...prev, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:ring-2 focus:ring-indigo-500/50 outline-none pr-32"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 text-xs font-medium">
                  .Creatopedia.tech
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Bio</label>
            <textarea
              rows={3}
              value={formData.bio || ''}
              onChange={e => setFormData(prev => ({ ...prev, bio: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-white focus:ring-2 focus:ring-indigo-500/50 outline-none resize-none"
            />
          </div>


        </>
      )}

      {section === 'integrations' && (
        <div className="space-y-8">
          <InstagramIntegration />

          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">TikTok App Key</label>
                <input
                  type="password"
                  value={formData.tiktok_api_key || ''}
                  onChange={e => setFormData(prev => ({ ...prev, tiktok_api_key: e.target.value }))}
                  placeholder="Paste TikTok Key"
                  className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:ring-2 focus:ring-indigo-500/50 outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="pt-6 border-t border-zinc-800 flex items-center justify-between">
        <div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          {success && <p className="text-emerald-400 text-sm">Settings saved!</p>}
        </div>
        <button
          type="submit"
          disabled={loading || uploading}
          className="px-8 py-3 rounded-xl bg-white text-black font-bold hover:bg-zinc-200 transition-all active:scale-95 disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  )
}
