'use client'

import { useEffect, useState } from 'react'
import { X, ExternalLink } from 'lucide-react'
import type { AdPlacementData } from './AdBanner'

interface Props {
  placements: AdPlacementData[]
  promptId: string
  creatorId?: string
}

export default function AdPopup({ placements, promptId, creatorId }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [hasImpressed, setHasImpressed] = useState(false)

  // Find placement for popup position
  const placement = placements.find(p => p.position === 'popup')

  useEffect(() => {
    if (!placement) return

    // Show popup after 1.5 seconds
    const timer = setTimeout(() => {
      setIsOpen(true)
    }, 1500)

    return () => clearTimeout(timer)
  }, [placement])

  useEffect(() => {
    if (isOpen && placement && !hasImpressed) {
      const sessionKey = `imp_popup_${placement.id}`
      if (!sessionStorage.getItem(sessionKey)) {
        const sessionId = sessionStorage.getItem('ph_sid') || null
        fetch('/api/ads/impression', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            campaign_id: placement.campaign.id,
            placement_id: placement.id,
            prompt_id: promptId,
            session_id: sessionId,
            creator_id: creatorId ?? placement.campaign.creator_id ?? null,
          }),
        }).catch(() => { })

        sessionStorage.setItem(sessionKey, '1')
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setHasImpressed(true)
      }
    }
  }, [isOpen, placement, hasImpressed, promptId, creatorId])

  if (!placement || !isOpen) return null

  const baseClickUrl = `/api/ads/click?placement_id=${placement.id}&campaign_id=${placement.campaign.id}&prompt_id=${promptId}`

  // Extract domain for display
  let displayUrl = placement.campaign.target_url
  try {
    const url = new URL(placement.campaign.target_url)
    displayUrl = url.hostname.replace('www.', '')
  } catch (e) { }

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    e.preventDefault()
    const sessionId = sessionStorage.getItem('ph_sid') || ''
    const url = `${baseClickUrl}&session_id=${encodeURIComponent(sessionId)}`
    window.open(url, '_blank', 'noopener,noreferrer')
    setIsOpen(false)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20 backdrop-blur-md animate-in fade-in duration-500">
      <div className="relative w-full max-w-xl bg-zinc-900 rounded-[32px] overflow-hidden shadow-[0_32px_128px_-12px_rgba(0,0,0,0.8)] border border-zinc-800 animate-in zoom-in-95 duration-500">
        {/* Close Button */}
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-6 right-6 z-20 p-2.5 rounded-full bg-black/40 text-zinc-400 hover:text-white hover:bg-black/60 backdrop-blur-md transition-all active:scale-95"
        >
          <X className="w-5 h-5" />
        </button>

        <a href={baseClickUrl} onClick={handleClick} className="block group">
          {/* Full Image Container */}
          <div className="relative w-full bg-black flex items-center justify-center overflow-hidden border-b border-zinc-800">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={placement.campaign.banner_url}
              alt={placement.campaign.banner_alt || placement.campaign.name}
              className="w-full h-auto max-h-[50vh] object-contain transition-transform duration-700 group-hover:scale-[1.02]"
            />
            {/* Subtle Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/40 to-transparent pointer-events-none" />
          </div>

          <div className="p-8 sm:p-10 text-center space-y-6 bg-gradient-to-b from-zinc-900 to-zinc-950">
            <div className="space-y-3">
              <span className="inline-block px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-bold uppercase tracking-widest border border-indigo-500/20">
                Sponsored
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight group-hover:text-indigo-400 transition-colors leading-tight">
                {placement.campaign.name}
              </h3>
              {placement.campaign.banner_alt && (
                <p className="text-zinc-400 text-sm sm:text-base leading-relaxed max-w-md mx-auto">
                  {placement.campaign.banner_alt}
                </p>
              )}
            </div>

            <div className="flex flex-col items-center gap-6 pt-2">
              <div className="inline-flex items-center gap-2 text-zinc-500 text-xs font-medium bg-zinc-800/50 px-3 py-1.5 rounded-lg border border-zinc-700/50">
                <ExternalLink className="w-3 h-3" />
                {displayUrl}
              </div>

              <span className="inline-flex items-center justify-center w-full sm:w-auto px-12 py-4 rounded-2xl bg-white text-black font-bold text-base transition-all group-hover:bg-indigo-50 group-hover:shadow-[0_20px_40px_-12px_rgba(255,255,255,0.2)] active:scale-[0.98]">
                Get Started Now
              </span>
            </div>
          </div>
        </a>
      </div>
    </div>
  )
}
