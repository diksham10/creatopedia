'use client'

import { useEffect, useRef } from 'react'

interface Props {
  html: string | null
  fallbackThumbnail?: string | null
  url: string
}

export default function VideoEmbed({ html, fallbackThumbnail, url }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!html || !ref.current) return

    // Force center any blockquotes
    const bq = ref.current.querySelector('blockquote')
    if (bq) {
      bq.style.margin = '0 auto'
      bq.style.maxWidth = '540px'
      bq.style.width = '100%'
    }

    // If the HTML is an Instagram blockquote (like from oEmbed or user paste),
    // we MUST manually load the script because dangerouslySetInnerHTML ignores <script> tags.
    if (html.includes('instagram-media')) {
      const processInstgrm = () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((window as any).instgrm) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (window as any).instgrm.Embeds.process()
        }
      }

      if (!document.getElementById('instagram-embed-script')) {
        const script = document.createElement('script')
        script.id = 'instagram-embed-script'
        script.src = 'https://www.instagram.com/embed.js'
        script.async = true
        script.onload = processInstgrm
        document.body.appendChild(script)
      } else {
        setTimeout(processInstgrm, 100)
      }
    }
  }, [html])

  // 1. Direct native video support (e.g., .mp4 files or /videos/ files)
  const isDirectVideo = url?.includes('.mp4') || url?.includes('/videos/')
  if (isDirectVideo && url) {
    return (
      <div className="w-full max-w-full mx-auto flex justify-center select-none animate-in fade-in duration-500">
        <video
          src={url}
          autoPlay
          loop
          muted
          playsInline
          controls
          className="w-full max-w-full rounded-2xl border border-white/10 hover:border-white/20 hover:scale-[1.01] transition-all duration-500 shadow-2xl bg-zinc-950"
        />
      </div>
    )
  }

  // 2. YouTube Video Support
  const isYouTube = url?.includes('youtube.com') || url?.includes('youtu.be')
  if (isYouTube && url) {
    let videoId = ''
    try {
      if (url.includes('youtu.be')) {
        videoId = url.split('/').pop()?.split('?')[0] || ''
      } else {
        const urlObj = new URL(url)
        videoId = urlObj.searchParams.get('v') || ''
      }
    } catch (e) {
      console.error('Failed to parse YouTube URL:', e)
    }

    if (videoId) {
      return (
        <div className="w-full max-w-full mx-auto flex justify-center select-none animate-in fade-in duration-500">
          <div className="relative w-full max-w-full aspect-video rounded-2xl overflow-hidden border border-white/10 hover:border-white/20 transition-all duration-500 shadow-2xl bg-zinc-950">
            <iframe
              src={`https://www.youtube.com/embed/${videoId}`}
              className="absolute inset-0 w-full h-full object-cover"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )
    }
  }

  // 3. Instagram URL fallback via standard iframe
  const isInstagram = url?.includes('instagram.com')
  if (isInstagram && url) {
    // Ensure URL ends with /embed
    const cleanUrl = url.split('?')[0].replace(/\/$/, '')
    const embedUrl = `${cleanUrl}/embed`

    return (
      <div className="w-full max-w-full mx-auto flex justify-center select-none animate-in fade-in duration-500">
        <div className="w-full max-w-full relative overflow-hidden rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-500 shadow-2xl bg-zinc-950 h-[480px] md:h-[720px] lg:h-[840px]">
          <iframe
            src={embedUrl}
            className="absolute top-[-44px] scale-105 left-0 w-full h-[calc(100%+108px)]"
            frameBorder="0"
            scrolling="no"
            allowTransparency={true}
            allow="encrypted-media; picture-in-picture"
          />
        </div>
      </div>
    )
  }

  // 4. oEmbed direct HTML renderer (e.g., valid Instagram oEmbed)
  if (html) {
    return (
      <div
        ref={ref}
        className="w-full overflow-hidden flex justify-center select-none animate-in fade-in duration-500"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    )
  }

  // 5. Absolute Fallback: Show thumbnail as a beautiful card
  const displayThumb = fallbackThumbnail || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80'
  return (
    <div className="w-full max-w-2xl mx-auto flex justify-center select-none animate-in fade-in duration-500">
      <a
        href={url || '#'}
        target="_blank"
        rel="noopener noreferrer"
        className="block rounded-[32px] sm:rounded-[40px] overflow-hidden relative aspect-video w-full max-w-[540px] bg-zinc-900/40 border border-white/10 group backdrop-blur-xl shadow-2xl hover:scale-[1.02] transition-all duration-500"
      >
        <img
          src={displayThumb}
          alt="Video thumbnail fallback"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-60 group-hover:opacity-85"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/25 transition-all duration-500">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 group-hover:scale-110 transition-all duration-500 shadow-xl group-hover:border-white/40">
            <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white ml-1 group-hover:text-blue-400 transition-colors duration-300" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
        <p className="absolute bottom-4 right-4 text-[10px] font-mono tracking-wider uppercase text-white/80 bg-zinc-900/60 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full select-none">
          Watch Video
        </p>
      </a>
    </div>
  )
}
