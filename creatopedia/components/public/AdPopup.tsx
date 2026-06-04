'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
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
  const [mounted, setMounted] = useState(false)

  // Find placement for popup position
  const placement = placements.find(p => p.position === 'popup')

  // Ensure we're mounted on the client before using portals
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!placement) return

    // Show popup after 1.5 seconds
    const timer = setTimeout(() => {
      setIsOpen(true)
    }, 1500)

    return () => clearTimeout(timer)
  }, [placement])

  // Lock background scroll while popup is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      document.documentElement.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
      document.documentElement.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
      document.documentElement.style.overflow = ''
    }
  }, [isOpen])

  // Track impressions
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

  if (!mounted || !placement || !isOpen) return null

  const baseClickUrl = `/api/ads/click?placement_id=${placement.id}&campaign_id=${placement.campaign.id}&prompt_id=${promptId}`

  // Extract domain for display
  let displayUrl = placement.campaign.target_url
  try {
    const url = new URL(placement.campaign.target_url)
    displayUrl = url.hostname.replace('www.', '')
  } catch { }

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    e.preventDefault()
    const sessionId = sessionStorage.getItem('ph_sid') || ''
    const url = `${baseClickUrl}&session_id=${encodeURIComponent(sessionId)}`
    window.open(url, '_blank', 'noopener,noreferrer')
    setIsOpen(false)
  }

  // Render via portal directly into document.body — this escapes ALL ancestor
  // CSS (overflow:hidden, transforms, backdrop-filter) that break position:fixed.
  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backgroundColor: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        animation: 'adPopupFadeIn 0.4s ease forwards',
      }}
    >
      <style>{`
        @keyframes adPopupFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes adPopupZoomIn {
          from { opacity: 0; transform: scale(0.92) translateY(16px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);    }
        }
      `}</style>

      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: 'linear-gradient(180deg, #18181b 0%, #0f0f10 100%)',
          borderRadius: '28px',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 40px 120px -20px rgba(0,0,0,0.9)',
          animation: 'adPopupZoomIn 0.45s cubic-bezier(0.22,1,0.36,1) forwards',
        }}
      >
        {/* Close Button */}
        <button
          onClick={() => setIsOpen(false)}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'rgba(0,0,0,0.5)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#a1a1aa',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,0,0,0.8)'
            ;(e.currentTarget as HTMLButtonElement).style.color = '#ffffff'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,0,0,0.5)'
            ;(e.currentTarget as HTMLButtonElement).style.color = '#a1a1aa'
          }}
        >
          <X style={{ width: '18px', height: '18px' }} />
        </button>

        <a href={baseClickUrl} onClick={handleClick} style={{ display: 'block', textDecoration: 'none' }}>
          {/* Banner Image */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              background: '#000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '28px 28px 0 0',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={placement.campaign.banner_url}
              alt={placement.campaign.banner_alt || placement.campaign.name}
              style={{
                width: '100%',
                height: 'auto',
                maxHeight: '45vh',
                objectFit: 'contain',
                display: 'block',
              }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to top, rgba(24,24,27,0.5), transparent)',
                pointerEvents: 'none',
              }}
            />
          </div>

          {/* Text & CTA */}
          <div style={{ padding: '28px 32px 32px', textAlign: 'center' }}>
            <div style={{ marginBottom: '16px' }}>
              <span
                style={{
                  display: 'inline-block',
                  padding: '4px 12px',
                  borderRadius: '999px',
                  background: 'rgba(99,102,241,0.12)',
                  border: '1px solid rgba(99,102,241,0.25)',
                  color: '#818cf8',
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  marginBottom: '12px',
                }}
              >
                Sponsored
              </span>
              <h3
                style={{
                  margin: '0 0 8px',
                  color: '#ffffff',
                  fontSize: 'clamp(20px, 4vw, 26px)',
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  lineHeight: 1.2,
                }}
              >
                {placement.campaign.name}
              </h3>
              {placement.campaign.banner_alt && (
                <p style={{ margin: 0, color: '#a1a1aa', fontSize: '14px', lineHeight: 1.6 }}>
                  {placement.campaign.banner_alt}
                </p>
              )}
            </div>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                color: '#71717a',
                fontSize: '12px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px',
                padding: '6px 12px',
                marginBottom: '20px',
              }}
            >
              <ExternalLink style={{ width: '12px', height: '12px' }} />
              {displayUrl}
            </div>

            <div
              style={{
                display: 'block',
                width: '100%',
                padding: '14px 24px',
                background: '#ffffff',
                color: '#000000',
                borderRadius: '14px',
                fontWeight: 700,
                fontSize: '15px',
                textAlign: 'center',
                transition: 'background 0.2s, transform 0.15s',
              }}
            >
              Get Started Now
            </div>
          </div>
        </a>
      </div>
    </div>,
    document.body
  )
}
