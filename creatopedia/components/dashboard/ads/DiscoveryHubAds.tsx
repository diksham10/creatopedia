'use client'

import { useState, useEffect } from 'react'
import type { Creator, AdCampaign, AdPlacement } from '@/types'
import AdCampaignForm from './AdCampaignForm'
import { useRouter } from 'next/navigation'

interface Props {
  creator: Creator
  campaigns: AdCampaign[]
  clients: { id: string; name: string }[]
  prompts: { id: string; title: string; slug: string }[]
  categories: { id: string; name: string }[]
}

type Pattern = 'every3' | 'every4' | 'every5' | 'custom'

export default function DiscoveryHubAds({
  creator,
  campaigns,
  clients,
  prompts,
  categories
}: Props) {
  const router = useRouter()
  const [adsEnabled, setAdsEnabled] = useState(creator.ads_enabled)
  const [adFrequency, setAdFrequency] = useState(creator.ad_frequency || 4)
  const [selectedPattern, setSelectedPattern] = useState<Pattern>('custom')
  const [slots, setSlots] = useState<Record<number, string>>({}) // index -> campaignId
  const [headerCampaignId, setHeaderCampaignId] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Fetch existing discovery placements
  useEffect(() => {
    async function fetchPlacements() {
      setLoading(true)
      try {
        const res = await fetch(`/api/ads/placements/discovery?creator_id=${creator.id}`)
        const data = await res.json()
        if (res.ok) {
          const slotMap: Record<number, string> = {}
          data.forEach((p: AdPlacement) => {
            if ((p.position as string) === 'discovery_header_banner') {
              setHeaderCampaignId(p.campaign_id)
            } else {
              const match = p.position.match(/discovery_slot_(\d+)/)
              if (match) {
                slotMap[parseInt(match[1])] = p.campaign_id
              }
            }
          })
          setSlots(slotMap)

          // Determine pattern if it matches one of the presets
          const indices = Object.keys(slotMap).map(Number).sort((a, b) => a - b)
          if (indices.length > 0) {
            const diff = indices[1] - indices[0]
            if (indices.every((val, i) => i === 0 || val === indices[i - 1] + diff)) {
              if (diff === 3) setSelectedPattern('every3')
              else if (diff === 4) setSelectedPattern('every4')
              else if (diff === 5) setSelectedPattern('every5')
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch placements', err)
      } finally {
        setLoading(false)
      }
    }
    fetchPlacements()
  }, [creator.id])

  const applyPattern = (p: Pattern) => {
    setSelectedPattern(p)
    if (p === 'custom') return

    const freq = p === 'every3' ? 3 : p === 'every4' ? 4 : 5
    const newSlots: Record<number, string> = {}
    const defaultCampaignId = campaigns[0]?.id || ''
    for (let i = freq - 1; i < 12; i += freq) {
      newSlots[i] = slots[i] || defaultCampaignId
    }
    setSlots(newSlots)
  }

  const toggleSlot = (index: number) => {
    setSelectedPattern('custom')
    const newSlots = { ...slots }
    if (newSlots[index] !== undefined) {
      delete newSlots[index]
    } else {
      newSlots[index] = campaigns[0]?.id || ''
    }
    setSlots(newSlots)
  }

  const updateSlotCampaign = (index: number, campaignId: string) => {
    setSlots(prev => ({ ...prev, [index]: campaignId }))
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      // 1. Save creator settings
      const creatorRes = await fetch('/api/creator', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ads_enabled: adsEnabled,
          ad_frequency: adFrequency
        }),
      })

      if (!creatorRes.ok) throw new Error('Failed to update creator settings')

      // 2. Save grid placements (including header banner)
      const placements = Object.entries(slots).map(([index, campaignId]) => ({
        index: parseInt(index),
        campaign_id: campaignId
      }))

      if (headerCampaignId) {
        placements.push({ index: -1, campaign_id: headerCampaignId }) // -1 signals header banner
      }

      const placementsRes = await fetch('/api/ads/placements/discovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slots: placements }),
      })

      if (!placementsRes.ok) throw new Error('Failed to update grid placements')

      setSuccess(true)
      router.refresh()
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-10">
      {/* Save Action Row */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className={`group flex items-center gap-3 px-8 py-3.5 rounded-2xl font-bold text-sm text-white shadow-2xl transition-all active:scale-95 disabled:opacity-50 min-w-[200px] justify-center ${success ? 'bg-emerald-600 shadow-emerald-500/20' : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/20'}`}
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              <span>Saving Changes...</span>
            </>
          ) : success ? (
            <>
              <span className="text-lg">✓</span>
              <span>Saved Successfully</span>
            </>
          ) : (
            <>
              <span className="opacity-50 group-hover:opacity-100 transition-opacity">💾</span>
              <span>Save All Changes</span>
            </>
          )}
        </button>
      </div>

      {/* Quick Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex items-center justify-between p-6 rounded-2xl bg-zinc-950 border border-zinc-800">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Enable Discovery Ads</h4>
            <p className="text-xs text-zinc-500">Show ads in your public profile grid.</p>
          </div>
          <button
            onClick={() => setAdsEnabled(!adsEnabled)}
            className={`w-12 h-7 rounded-full transition-all relative ${adsEnabled ? 'bg-indigo-600 shadow-lg shadow-indigo-500/20' : 'bg-zinc-800'}`}
          >
            <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${adsEnabled ? 'left-6' : 'left-1'}`} />
          </button>
        </div>

        <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Global Frequency</h4>
            <span className="text-indigo-400 font-mono font-bold">Every {adFrequency} items</span>
          </div>
          <input
            type="range"
            min="2"
            max="10"
            value={adFrequency}
            onChange={(e) => setAdFrequency(parseInt(e.target.value))}
            className="w-full accent-indigo-500"
          />
          <p className="text-[10px] text-zinc-500 text-center">Used as fallback if no specific grid slots are assigned.</p>
        </div>
      </div>

      {/* Header Banner Slot */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            Upper Section Ad (Banner)
          </h3>
          {headerCampaignId && (
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest px-2 py-1 bg-indigo-500/10 rounded-full border border-indigo-500/20">Active</span>
          )}
        </div>
        <div className={`group relative p-1 rounded-[32px] border-2 transition-all duration-500 ${headerCampaignId ? 'border-indigo-500/50 bg-indigo-500/5 shadow-2xl shadow-indigo-500/10' : 'border-dashed border-zinc-800 bg-zinc-950/50 hover:border-zinc-700'}`}>
          <div className="flex flex-col lg:flex-row items-stretch gap-6 p-4">
            <div className={`relative flex-1 h-48 sm:h-64 rounded-2xl flex items-center justify-center border overflow-hidden transition-all duration-500 ${headerCampaignId ? 'border-indigo-500/30 bg-zinc-900' : 'border-zinc-800/50 bg-zinc-900/30'}`}>
              {headerCampaignId ? (
                <>
                  <img 
                    src={campaigns.find(c => c.id === headerCampaignId)?.banner_url} 
                    alt="Banner Preview" 
                    className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />
                  <div className="relative z-10 text-center">
                    <span className="text-xs font-black text-white/40 uppercase tracking-[0.2em]">Banner Preview</span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-800/50 flex items-center justify-center border border-zinc-700/50">
                    <span className="text-2xl opacity-20">🖼️</span>
                  </div>
                  <span className="text-zinc-600 text-[10px] font-black uppercase tracking-widest">No Banner Assigned</span>
                </div>
              )}
            </div>
            
            <div className="w-full lg:w-80 flex flex-col justify-between py-2 gap-6">
              <div className="space-y-2">
                <p className="text-sm font-bold text-white">Featured Header Ad</p>
                <p className="text-xs text-zinc-500 leading-relaxed">This ad appears as a full-width featured banner at the top of your discovery hub, above all prompts.</p>
              </div>
              
              <div className="space-y-3">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Select Campaign</label>
                <select
                  value={headerCampaignId}
                  onChange={(e) => setHeaderCampaignId(e.target.value)}
                  className="w-full bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all cursor-pointer hover:border-zinc-700"
                >
                  <option value="">(None - Disabled)</option>
                  {campaigns.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
 
      {/* Grid Designer */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-white">Grid Placement Designer</h3>
            <p className="text-sm text-zinc-500">Assign ad slots to specific positions in your prompt gallery.</p>
          </div>
          
          <div className="flex items-center gap-2 p-1.5 bg-zinc-950 border border-zinc-800 rounded-2xl">
            {(['every3', 'every4', 'every5', 'custom'] as Pattern[]).map((p) => (
              <button
                key={p}
                onClick={() => applyPattern(p)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${selectedPattern === p ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50'}`}
              >
                {p === 'custom' ? 'Custom' : p.replace('every', 'Every ')}
              </button>
            ))}
          </div>
        </div>
 
        {loading ? (
          <div className="h-96 flex items-center justify-center bg-zinc-950/50 rounded-[40px] border border-dashed border-zinc-800">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.3)]"></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-2 sm:p-0">
            {Array.from({ length: 12 }).map((_, i) => {
              const isAd = slots[i] !== undefined
              const campaignId = slots[i]
              const campaign = campaigns.find(c => c.id === campaignId)
 
              return (
                <div key={i} className="relative group aspect-[3/4] sm:aspect-[4/5] rounded-[28px] overflow-hidden transition-all duration-500">
                  <button
                    onClick={() => toggleSlot(i)}
                    className={`absolute inset-0 w-full h-full border-2 transition-all duration-500 flex flex-col items-center justify-center gap-3 ${isAd 
                      ? 'border-indigo-500/50 bg-zinc-900 shadow-xl shadow-indigo-500/10' 
                      : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700 hover:bg-zinc-900/50'}`}
                  >
                    {isAd ? (
                      <>
                        {campaign?.banner_url ? (
                          <img src={campaign.banner_url} alt="Ad" className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:scale-110 transition-transform duration-700" />
                        ) : null}
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
                        <div className="relative z-10 flex flex-col items-center gap-2 px-4 text-center">
                          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] drop-shadow-lg">Ad Slot {i + 1}</span>
                          <div className="text-[11px] font-bold text-white truncate max-w-full drop-shadow-lg bg-zinc-950/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/5">
                            {campaign?.name || 'Pick Campaign'}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center gap-2 opacity-20 group-hover:opacity-60 transition-all duration-500 scale-90 group-hover:scale-100">
                        <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                          <span className="text-lg">📄</span>
                        </div>
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Item {i + 1}</span>
                      </div>
                    )}
 
                    {/* Status Indicator */}
                    <div className="absolute top-4 right-4 z-20">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${isAd ? 'bg-indigo-500 border-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'bg-transparent border-zinc-800 group-hover:border-zinc-600'}`}>
                        {isAd && <span className="text-[10px] text-white font-bold">✓</span>}
                      </div>
                    </div>
                  </button>
 
                  {/* Absolute positioned campaign selector for active ads */}
                  {isAd && (
                    <div className="absolute bottom-4 left-4 right-4 z-30 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                      <select
                        value={campaignId}
                        onClick={(e) => e.stopPropagation()} // Prevent toggle when clicking select
                        onChange={(e) => updateSlotCampaign(i, e.target.value)}
                        className="w-full bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-xl px-3 py-2 text-[10px] text-white font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-2xl"
                      >
                        {campaigns.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Campaign Management */}
      <div className="pt-10 border-t border-zinc-800">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-white">Ad Campaigns</h3>
            <p className="text-sm text-zinc-500">Create standalone ads or assign client campaigns.</p>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all"
          >
            {showCreateForm ? 'Close Form' : '+ Create New Ad'}
          </button>
        </div>

        {showCreateForm && (
          <div className="mb-10 p-8 bg-zinc-950 border border-zinc-800 rounded-3xl animate-in slide-in-from-top-4 duration-300">
            <h4 className="text-md font-bold text-white mb-6">Create Standalone Ad</h4>
            <AdCampaignForm
              clients={clients}
              prompts={prompts}
              categories={categories}
              onSuccess={() => {
                setShowCreateForm(false)
                router.refresh()
              }}
              onCancel={() => setShowCreateForm(false)}
            />
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {campaigns.map(c => (
            <div key={c.id} className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800 group hover:border-zinc-700 transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-zinc-800 border border-zinc-700 overflow-hidden shrink-0">
                  {c.banner_url ? (
                    <img src={c.banner_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs font-bold">AD</div>
                  )}
                </div>
                <div className="min-w-0">
                  <h5 className="text-sm font-bold text-white truncate">{c.name}</h5>
                  <p className="text-[10px] text-zinc-500 truncate">{c.client?.name || 'Standalone'}</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className={`px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter ${c.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-800 text-zinc-500'}`}>
                  {c.status}
                </span>
                <span className="text-zinc-500 font-mono">{c.clicks_count || 0} Clicks</span>
              </div>
            </div>
          ))}
          {campaigns.length === 0 && (
            <div className="col-span-full py-10 text-center bg-zinc-950/50 rounded-2xl border border-dashed border-zinc-800">
              <p className="text-zinc-500 text-sm">No campaigns found. Create your first one to assign it to the grid.</p>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="fixed bottom-12 right-8 z-50 bg-red-600 text-white px-6 py-3 rounded-xl text-sm font-bold shadow-2xl animate-in fade-in slide-in-from-bottom-4">
          {error}
        </div>
      )}
    </div>
  )
}
