'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AdPlacementPosition, AdCampaign } from '@/types'

export interface AdPlacementData {
  id: string
  position: AdPlacementPosition
  is_global: boolean
  prompt_id: string | null
  creator_id: string | null
  campaign: AdCampaign
}

interface Props {
  placements: AdPlacementData[]
  position: AdPlacementPosition
  promptId?: string
  creatorId?: string
  fill?: boolean
}

export default function AdBanner({ placements, position, promptId, creatorId, fill }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [hasImpressed, setHasImpressed] = useState(false)

  // Viewport time tracking
  const startTimeRef = useRef<number | null>(null)
  const totalViewTimeRef = useRef<number>(0)

  // Find placements for this exact position
  const validPlacements = useMemo<AdPlacementData[]>(() => {
    const positionMatches = placements.filter(p => p.position === position)

    // If a creatorId is provided, prioritize ads specifically for this creator
    if (creatorId) {
      const creatorSpecific = positionMatches.filter(p => p.creator_id === creatorId)
      if (creatorSpecific.length > 0) return creatorSpecific
    }

    // Fallback to global ads for this position
    return positionMatches.filter(p => p.is_global)
  }, [placements, position, creatorId])

  // Pick one (randomly) and stick with it for the lifetime of this component instance
  const [placement] = useState<AdPlacementData | null>(() => {
    if (validPlacements.length === 0) return null
    const randomIndex = Math.floor(Math.random() * validPlacements.length)
    return validPlacements[randomIndex]
  })

  useEffect(() => {
    if (!placement) return

    const sessionKey = `imp_${placement.id}`

    const sendDuration = () => {
      if (startTimeRef.current !== null) {
        const duration = (Date.now() - startTimeRef.current) / 1000
        totalViewTimeRef.current += duration
        startTimeRef.current = null

        if (duration > 0.5) { // Only track if at least half a second
          fetch('/api/analytics/event', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt_id: promptId,
              campaign_id: placement.campaign.id,
              type: 'ad_view_duration',
              value: parseFloat(duration.toFixed(2)),
              session_id: sessionStorage.getItem('ph_sid'),
              creator_id: creatorId ?? placement.campaign.creator_id ?? null,
            }),
          }).catch(() => { })
        }
      }
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries

        if (entry.isIntersecting) {
          // Start timer
          startTimeRef.current = Date.now()

          // Original Impression logic (one-time per session)
          if (!hasImpressed && !sessionStorage.getItem(sessionKey)) {
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
            setHasImpressed(true)
          }
        } else {
          // Left viewport, stop timer and send
          sendDuration()
        }
      },
      { threshold: 0.5 } // 50% visible
    )

    if (containerRef.current) observer.observe(containerRef.current)

    // Also send if the user leaves the page while looking at the ad
    const handleUnload = () => sendDuration()
    window.addEventListener('beforeunload', handleUnload)

    return () => {
      observer.disconnect()
      window.removeEventListener('beforeunload', handleUnload)
      sendDuration()
    }
  }, [placement, hasImpressed, promptId, creatorId])

  if (!placement) return null

  // Build click URL reading sessionStorage at click time, not render time
  const baseClickUrl = `/api/ads/click?placement_id=${placement.id}&campaign_id=${placement.campaign.id}&prompt_id=${promptId}`

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    e.preventDefault()
    const sessionId = sessionStorage.getItem('ph_sid') || ''
    const url = `${baseClickUrl}&session_id=${encodeURIComponent(sessionId)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div 
      ref={containerRef} 
      className={`relative w-full overflow-hidden transition-transform hover:scale-[1.01] ${fill ? 'h-full' : 'rounded-2xl sm:rounded-3xl bg-zinc-900 border border-zinc-800'}`}
    >
      <a href={baseClickUrl} onClick={handleClick} target="_blank" rel="noopener noreferrer" className={`block w-full ${fill ? 'h-full' : ''}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={placement.campaign.banner_url}
          alt={placement.campaign.banner_alt || 'Advertisement'}
          className={`w-full object-cover ${fill ? 'h-full' : 'h-auto'}`}
        />
      </a>
      <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded bg-zinc-950/60 backdrop-blur-md text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-zinc-400 select-none pointer-events-none z-20">
        Sponsored
      </span>
    </div>
  )
}
