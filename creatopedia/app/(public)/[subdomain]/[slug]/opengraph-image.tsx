import { ImageResponse } from 'next/og'
import { apiFetchServer } from '@/lib/api/server'

export const runtime = 'nodejs'

export const size = {
  width: 1200,
  height: 630,
}

export const contentType = 'image/png'

interface Props {
  params: Promise<{ subdomain: string; slug: string }>
}

export default async function Image({ params }: Props) {
  const { subdomain, slug } = await params

  // Fetch creator and prompt in parallel for speed
  const [creatorRes, prompt] = await Promise.all([
    apiFetchServer<{
      creator: { name: string; handle: string; avatar_url: string | null }
      theme_color?: string
    } | null>(`/users/${subdomain}`),
    
    // We can't fetch by slug directly yet, so we'll look it up via creator
    apiFetchServer<{creator: {id: string}}>(`/users/${subdomain}`).then(async (dbP) => {
      if (!dbP || !dbP.creator) return null
      const pRes = await apiFetchServer<any>(`/prompts?creator_id=${dbP.creator.id}&status=published`)
      const list = Array.isArray(pRes) ? pRes : (pRes?.items || [])
      return list.find((p: any) => p.slug === slug)
    })
  ])

  const creator = creatorRes?.creator
  const brandColor = creatorRes?.theme_color ?? '#6366f1'
  const title = prompt?.title ?? 'Untitled Prompt'
  const description = prompt?.description ?? (prompt?.ai_tool ? `A ${prompt.ai_tool} prompt` : 'AI Prompt')
  const creatorName = creator?.name ?? subdomain
  const aiTool = prompt?.ai_tool ?? 'AI'

  // Fallback: Branded template for when NO image is provided or handled by direct URL.
  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          background: '#0a0a0a',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Gradient background */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(135deg, ${brandColor}22 0%, #0a0a0a 50%, ${brandColor}11 100%)`,
            display: 'flex',
          }}
        />

        {/* Left glow */}
        <div
          style={{
            position: 'absolute',
            top: '-100px',
            left: '-100px',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: `${brandColor}33`,
            filter: 'blur(80px)',
            display: 'flex',
          }}
        />

        {/* Content row */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            width: '100%',
            height: '100%',
            padding: '60px',
            gap: '48px',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {/* Left: text content */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              justifyContent: 'space-between',
            }}
          >
            {/* Top: branding */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: brandColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span style={{ color: 'white', fontSize: '16px', fontWeight: 700 }}>P</span>
              </div>
              <span style={{ color: '#888', fontSize: '16px', letterSpacing: '0.05em' }}>
                Creatopedia
              </span>
            </div>

            {/* Middle: title + description */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* AI tool badge */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  width: 'fit-content',
                }}
              >
                <div
                  style={{
                    background: `${brandColor}33`,
                    border: `1px solid ${brandColor}66`,
                    borderRadius: '20px',
                    padding: '4px 14px',
                    color: brandColor,
                    fontSize: '13px',
                    fontWeight: 600,
                    letterSpacing: '0.05em',
                    display: 'flex',
                  }}
                >
                  {aiTool.toUpperCase()}
                </div>
              </div>

              <div
                style={{
                  color: '#ffffff',
                  fontSize: title.length > 40 ? '36px' : '44px',
                  fontWeight: 800,
                  lineHeight: 1.15,
                  letterSpacing: '-0.02em',
                  display: 'flex',
                }}
              >
                {title.length > 60 ? title.slice(0, 57) + '...' : title}
              </div>

              {description && (
                <div
                  style={{
                    color: '#aaaaaa',
                    fontSize: '18px',
                    lineHeight: 1.5,
                    display: 'flex',
                  }}
                >
                  {description.length > 100 ? description.slice(0, 97) + '...' : description}
                </div>
              )}
            </div>

            {/* Bottom: creator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: brandColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 700,
                }}
              >
                {creatorName[0]?.toUpperCase()}
              </div>
              <span style={{ color: '#cccccc', fontSize: '15px' }}>{creatorName}</span>
              {creator?.handle && (
                <span style={{ color: '#555', fontSize: '14px' }}>· {creator.handle}</span>
              )}
            </div>
          </div>

          {/* Right Placeholder (Branded) */}
          <div
            style={{
              width: '380px',
              height: '380px',
              borderRadius: '24px',
              background: `linear-gradient(145deg, ${brandColor}33, #151515)`,
              border: `2px solid ${brandColor}44`,
              flexShrink: 0,
              alignSelf: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '24px',
              boxShadow: `0 20px 40px rgba(0,0,0,0.4), 0 0 60px ${brandColor}11`,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Decorative inner glow */}
            <div style={{
              position: 'absolute',
              top: '-50%',
              left: '-50%',
              width: '200%',
              height: '200%',
              background: `radial-gradient(circle at center, ${brandColor}11 0%, transparent 70%)`,
              display: 'flex',
            }} />

            <div style={{
              width: '140px',
              height: '140px',
              borderRadius: '40px',
              background: brandColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 10px 30px ${brandColor}66`,
              zIndex: 2,
            }}>
              <span style={{ fontSize: '70px', color: 'white' }}>✦</span>
            </div>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              zIndex: 2,
            }}>
              <span style={{
                fontSize: '28px',
                fontWeight: 800,
                color: 'white',
                letterSpacing: '0.05em',
              }}>
                {aiTool.toUpperCase()}
              </span>
              <span style={{
                fontSize: '14px',
                fontWeight: 600,
                color: `${brandColor}`,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                opacity: 0.8,
              }}>
                Premium Prompt
              </span>
            </div>
          </div>
        </div>

        {/* Bottom border accent */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: `linear-gradient(90deg, transparent, ${brandColor}, transparent)`,
            display: 'flex',
          }}
        />
      </div>
    ),
    {
      ...size,
    }
  )
}
