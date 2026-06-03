'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { AdCampaign, AdCampaignStatus, AdPlacementPosition } from '@/types'
import { uploadFile } from '@/lib/api/client'
import PromptPlacementDesigner from './PromptPlacementDesigner'

const inputCls = 'w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all text-sm'
const labelCls = 'block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2'

interface Props {
  defaultValues?: Partial<AdCampaign>
  campaignId?: string
  clients: { id: string; name: string }[]
  prompts: { id: string; title: string; slug: string }[]
  categories: { id: string; name: string }[]
  initialClientId?: string
  onSuccess?: () => void
  onCancel?: () => void
}

type FieldErrors = Record<string, string[]>

export default function AdCampaignForm({
  defaultValues,
  campaignId,
  clients,
  prompts,
  categories,
  initialClientId,
  onSuccess,
  onCancel
}: Props) {
  const router = useRouter()
  const isEdit = !!campaignId

  const [name, setName] = useState(defaultValues?.name ?? '')
  const [clientId, setClientId] = useState(defaultValues?.client_id ?? initialClientId ?? '')
  const [status, setStatus] = useState<'active' | 'paused' | 'ended' | 'scheduled'>(defaultValues?.status ?? 'active')
  const [startsAt, setStartsAt] = useState(defaultValues?.starts_at ? new Date(defaultValues.starts_at).toISOString().slice(0, 16) : '')
  const [endsAt, setEndsAt] = useState(defaultValues?.ends_at ? new Date(defaultValues.ends_at).toISOString().slice(0, 16) : '')

  const [bannerUrl, setBannerUrl] = useState(defaultValues?.banner_url ?? '')
  const [bannerAlt, setBannerAlt] = useState(defaultValues?.banner_alt ?? '')
  const [targetUrl, setTargetUrl] = useState(defaultValues?.target_url ?? '')

  const [utmSource, setUtmSource] = useState(defaultValues?.utm_source ?? 'creatopedia')
  const [utmMedium, setUtmMedium] = useState(defaultValues?.utm_medium ?? 'banner')
  const [utmCampaign, setUtmCampaign] = useState(defaultValues?.utm_campaign ?? '')

  const [clientWebhookUrl, setClientWebhookUrl] = useState(defaultValues?.client_webhook_url ?? '')
  const reportToken = defaultValues?.report_token ?? ''

  // Placements
  const existingGlobal = defaultValues?.ad_placements?.find(p => p.is_global)
  const existingSpecific = defaultValues?.ad_placements?.filter(p => !p.is_global) ?? []

  const [selectedPrompts, setSelectedPrompts] = useState<Record<string, AdPlacementPosition>>(
    existingSpecific.filter(p => p.prompt_id).reduce((acc, p) => ({ ...acc, [p.prompt_id!]: p.position }), {})
  )
  const [selectedCategories, setSelectedCategories] = useState<Record<string, AdPlacementPosition>>(
    existingSpecific.filter(p => p.category_id).reduce((acc, p) => ({ ...acc, [p.category_id!]: p.position }), {})
  )

  const [globalPosition, setGlobalPosition] = useState<AdPlacementPosition>(existingGlobal?.position ?? 'above_prompt')

  const [placementType, setPlacementType] = useState<'global' | 'prompts' | 'categories'>(
    existingGlobal ? 'global' : (existingSpecific.some(p => p.category_id) ? 'categories' : (isEdit ? 'prompts' : 'global'))
  )

  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [serverError, setServerError] = useState<string | null>(null)

  function handleNameChange(newName: string) {
    setName(newName)
    if (!isEdit && !utmCampaign) {
      const suggested = newName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      setUtmCampaign(suggested)
    }
  }

  const finalUrl = targetUrl ? `${targetUrl}${targetUrl.includes('?') ? '&' : '?'}utm_source=${utmSource}&utm_medium=${utmMedium}${utmCampaign ? `&utm_campaign=${utmCampaign}` : ''}` : ''

  async function handleBannerUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setServerError(null)
    try {
      const url = await uploadFile(file)
      setBannerUrl(url)
    } catch (err: any) {
      setServerError(err.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  function copyReportLink() {
    const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN ?? 'creatopedia.tech'
    navigator.clipboard.writeText(`https://${baseDomain}/ads/report/${reportToken}`)
    alert('Report link copied to clipboard!')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setErrors({})
    setServerError(null)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let placements: any[] = []
    if (placementType === 'global') {
      placements = [{ is_global: true, position: globalPosition }]
    } else if (placementType === 'categories') {
      placements = Object.entries(selectedCategories).map(([catId, pos]) => ({ category_id: catId, position: pos, is_global: false }))
    } else {
      placements = Object.entries(selectedPrompts).map(([pId, pos]) => ({ prompt_id: pId, position: pos, is_global: false }))
    }

    const body = {
      name,
      client_id: clientId || null,
      status,
      starts_at: startsAt ? new Date(startsAt).toISOString() : null,
      ends_at: endsAt ? new Date(endsAt).toISOString() : null,
      banner_url: bannerUrl,
      banner_alt: bannerAlt || null,
      target_url: targetUrl,
      utm_source: utmSource,
      utm_medium: utmMedium,
      utm_campaign: utmCampaign || null,
      client_webhook_url: clientWebhookUrl || null,
      placements
    }

    const url = isEdit ? `/api/ads/campaigns/${campaignId}` : '/api/ads/campaigns'
    const method = isEdit ? 'PATCH' : 'POST'

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    setSaving(false)

    if (!res.ok) {
      if (data.error?.fieldErrors) {
        setErrors(data.error.fieldErrors)
      } else {
        setServerError(data.error ?? 'An error occurred')
      }
      return
    }

    if (onSuccess) {
      onSuccess()
    } else {
      router.push('/dashboard/ads/campaigns')
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-12">
      {serverError && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-4 rounded-xl">
          {serverError}
        </div>
      )}

      {/* 1. Campaign Details */}
      <section className="space-y-6">
        <h2 className="text-xl font-bold text-white border-b border-zinc-800 pb-4">1. Campaign Details</h2>

        <div>
          <label className={labelCls}>Campaign Name *</label>
          <input type="text" value={name} onChange={e => handleNameChange(e.target.value)} placeholder="Nike Summer 2025" className={inputCls} required />
          {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name[0]}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className={labelCls}>Client</label>
            <div className="flex gap-2">
              <select value={clientId} onChange={e => setClientId(e.target.value)} className={inputCls}>
                <option value="">None (Internal Campaign)</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <Link href="/dashboard/ads/clients/new" className="flex items-center px-4 rounded-xl border border-zinc-700 text-zinc-400 hover:text-white transition-colors" title="Add Client">+</Link>
            </div>
          </div>
          <div>
            <label className={labelCls}>Status</label>
            <select value={status} onChange={e => setStatus(e.target.value as AdCampaignStatus)} className={inputCls}>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="scheduled">Scheduled</option>
              <option value="ended">Ended</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className={labelCls}>Start Date (Optional)</label>
            <input type="datetime-local" value={startsAt} onChange={e => setStartsAt(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>End Date (Optional)</label>
            <input type="datetime-local" value={endsAt} onChange={e => setEndsAt(e.target.value)} className={inputCls} />
          </div>
        </div>
      </section>

      {/* 2. Ad Creative */}
      <section className="space-y-6">
        <h2 className="text-xl font-bold text-white border-b border-zinc-800 pb-4">2. Ad Creative</h2>

        <div>
          <label className={labelCls}>Banner Image *</label>
          <div className="flex gap-4 items-start">
            <div className="flex-1">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleBannerUpload}
                className="block w-full text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 transition-all cursor-pointer"
              />
              <p className="text-zinc-500 text-xs mt-1">Recommended: 1200 × 300px (4:1 ratio). Max 5MB.</p>
              {uploading && <p className="text-indigo-400 text-xs mt-1">Uploading…</p>}
              {errors.banner_url && <p className="text-red-400 text-xs mt-1">{errors.banner_url[0]}</p>}
            </div>
          </div>

          {bannerUrl && (
            <div className="mt-6">
              <p className="text-xs text-zinc-500 mb-2">Live Preview (rendered size may vary):</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={bannerUrl} alt="Banner Preview" className="w-full max-w-2xl h-auto rounded-xl border border-zinc-700 object-cover" />
            </div>
          )}
        </div>

        <div>
          <label className={labelCls}>Alt Text</label>
          <input type="text" value={bannerAlt} onChange={e => setBannerAlt(e.target.value)} placeholder="Nike running shoes banner" className={inputCls} />
          <p className="text-[10px] text-zinc-500 mt-1">For accessibility and screen readers.</p>
        </div>

        <div>
          <label className={labelCls}>Destination URL *</label>
          <input type="url" value={targetUrl} onChange={e => setTargetUrl(e.target.value)} placeholder="https://nike.com/summer-sale" className={inputCls} required />
          {errors.target_url && <p className="text-red-400 text-xs mt-1">{errors.target_url[0]}</p>}
        </div>
      </section>

      {/* 3. UTM Tracking */}
      <section className="space-y-6">
        <h2 className="text-xl font-bold text-white border-b border-zinc-800 pb-4">3. UTM Tracking</h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div>
            <label className={labelCls}>utm_source</label>
            <input type="text" value={utmSource} onChange={e => setUtmSource(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>utm_medium</label>
            <input type="text" value={utmMedium} onChange={e => setUtmMedium(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>utm_campaign</label>
            <input type="text" value={utmCampaign} onChange={e => setUtmCampaign(e.target.value)} className={inputCls} />
          </div>
        </div>

        {finalUrl && (
          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1 overflow-hidden">
              <p className="text-xs text-zinc-500 mb-1">Final Destination URL:</p>
              <p className="text-sm text-indigo-400 font-mono truncate">{finalUrl}</p>
            </div>
            <button
              type="button"
              onClick={() => { navigator.clipboard.writeText(finalUrl); alert('Copied!') }}
              className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white transition-colors whitespace-nowrap"
            >
              Copy URL
            </button>
          </div>
        )}
      </section>

      {/* 4. Placement Rules */}
      <section className="space-y-6">
        <h2 className="text-xl font-bold text-white border-b border-zinc-800 pb-4">4. Placement Rules</h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              id: 'global', title: 'Global', desc: 'All prompt pages', icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="Language" /></svg>
              )
            },
            {
              id: 'categories', title: 'Categories', desc: 'Target specific groups', icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
              )
            },
            {
              id: 'prompts', title: 'Individual', desc: 'Pick specific pages', icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              )
            },
          ].map((type) => (
            <button
              key={type.id}
              type="button"
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              onClick={() => setPlacementType(type.id as any)}
              className={`p-4 rounded-2xl border text-left transition-all ${placementType === type.id
                ? 'bg-indigo-600 border-indigo-500 shadow-lg shadow-indigo-500/20'
                : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                }`}
            >
              <div className={`mb-3 w-10 h-10 rounded-xl flex items-center justify-center ${placementType === type.id ? 'bg-white/20 text-white' : 'bg-zinc-800 text-zinc-400'}`}>
                {type.id === 'global' ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                ) : type.id === 'categories' ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                )}
              </div>
              <p className={`font-bold text-sm ${placementType === type.id ? 'text-white' : 'text-zinc-300'}`}>{type.title}</p>
              <p className={`text-[11px] ${placementType === type.id ? 'text-indigo-100' : 'text-zinc-500'}`}>{type.desc}</p>
            </button>
          ))}
        </div>

        {placementType === 'global' && (
          <div className="p-8 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-6">
            <div className="flex items-center gap-3 text-indigo-400 mb-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <p className="text-sm font-semibold uppercase tracking-wider">Visual Placement Designer</p>
            </div>
            <PromptPlacementDesigner 
              selectedPosition={globalPosition} 
              onChange={setGlobalPosition}
              bannerUrl={bannerUrl}
            />
          </div>
        )}

        {placementType === 'categories' && (
          <div className="pl-4 border-l-2 border-zinc-800 mt-4 space-y-6">
            {(categories as any[]).map(c => {
              const isSelected = !!selectedCategories[c.id]
              return (
                <div key={c.id} className={`p-6 rounded-2xl border flex flex-col gap-6 transition-all ${isSelected ? 'bg-indigo-600/5 border-indigo-500/20' : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'}`}>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCategories(prev => ({ ...prev, [c.id]: 'above_prompt' }))
                        } else {
                          const next = { ...selectedCategories }
                          delete next[c.id]
                          setSelectedCategories(next)
                        }
                      }}
                      className="w-6 h-6 rounded-lg text-indigo-600 focus:ring-indigo-500 bg-zinc-800 border-zinc-700"
                    />
                    <p className="font-bold text-lg text-white">{c.name}</p>
                  </label>
                  
                  {isSelected && (
                    <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800">
                      <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Placement for {c.name}</p>
                      <PromptPlacementDesigner 
                        selectedPosition={selectedCategories[c.id]} 
                        onChange={(pos) => setSelectedCategories(prev => ({ ...prev, [c.id]: pos }))}
                        bannerUrl={bannerUrl}
                      />
                    </div>
                  )}
                </div>
              )
            })}
            {categories.length === 0 && <p className="text-zinc-500 text-sm">No categories found.</p>}
          </div>
        )}

        {placementType === 'prompts' && (
          <div className="pl-4 border-l-2 border-zinc-800 mt-4 space-y-6">
            {prompts.map(p => {
              const isSelected = !!selectedPrompts[p.id]
              return (
                <div key={p.id} className={`p-6 rounded-2xl border flex flex-col gap-6 transition-all ${isSelected ? 'bg-indigo-600/5 border-indigo-500/20' : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'}`}>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPrompts(prev => ({ ...prev, [p.id]: 'above_prompt' }))
                        } else {
                          const next = { ...selectedPrompts }
                          delete next[p.id]
                          setSelectedPrompts(next)
                        }
                      }}
                      className="w-6 h-6 rounded-lg text-indigo-600 focus:ring-indigo-500 bg-zinc-800 border-zinc-700"
                    />
                    <div>
                      <p className="font-bold text-lg text-white">{p.title}</p>
                      <p className="text-xs text-zinc-500 font-mono">/{p.slug}</p>
                    </div>
                  </label>

                  {isSelected && (
                    <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800">
                      <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Placement for {p.title}</p>
                      <PromptPlacementDesigner 
                        selectedPosition={selectedPrompts[p.id]} 
                        onChange={(pos) => setSelectedPrompts(prev => ({ ...prev, [p.id]: pos }))}
                        bannerUrl={bannerUrl}
                      />
                    </div>
                  )}
                </div>
              )
            })}
            {prompts.length === 0 && <p className="text-zinc-500 text-sm">You don&apos;t have any published prompts yet.</p>}
          </div>
        )}
      </section>

      {/* 5. Client Reporting */}
      <section className="space-y-6">
        <h2 className="text-xl font-bold text-white border-b border-zinc-800 pb-4">5. Client Reporting</h2>

        {isEdit && reportToken && (
          <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 flex flex-col gap-3">
            <p className="text-sm font-semibold text-white">Shareable Report Link</p>
            <p className="text-xs text-zinc-500">Share this read-only link with your client so they can track performance in real-time.</p>
            <div className="flex gap-3">
              <button type="button" onClick={copyReportLink} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs font-semibold text-white transition-colors">Copy Link</button>
              <Link href={`/ads/report/${reportToken}`} target="_blank" className="px-4 py-2 border border-zinc-700 hover:border-zinc-500 rounded-lg text-xs font-semibold text-zinc-300 transition-colors">Open Report →</Link>
            </div>
          </div>
        )}

        <div>
          <label className={labelCls}>Client Webhook URL (Optional)</label>
          <input type="url" value={clientWebhookUrl} onChange={e => setClientWebhookUrl(e.target.value)} placeholder="https://client-system.com/webhook" className={inputCls} />
          <p className="text-[10px] text-zinc-500 mt-1">We&apos;ll POST click events here in real-time.</p>
        </div>
      </section>

      {/* Submit */}
      <div className="flex gap-3 pt-6 border-t border-zinc-800 justify-end">
        <button
          type="button"
          onClick={() => onCancel ? onCancel() : router.back()}
          className="px-6 py-3 rounded-xl border border-zinc-700 text-sm font-semibold text-zinc-400 hover:text-white hover:border-zinc-600 transition-all"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving || !bannerUrl || (placementType === 'prompts' && Object.keys(selectedPrompts).length === 0) || (placementType === 'categories' && Object.keys(selectedCategories).length === 0)}
          className="px-8 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 shadow-lg shadow-indigo-500/20"
        >
          {saving ? 'Saving…' : isEdit ? 'Save Campaign' : 'Create Campaign'}
        </button>
      </div>
    </form>
  )
}
