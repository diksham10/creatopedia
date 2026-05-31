import Image from 'next/image'
import type { Creator } from '@/types'

interface Props {
  creator: Creator
}

export default function CreatorBar({ creator }: Props) {
  return (
    <header className="w-full border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
        {/* Avatar */}
        <div
          className="relative flex-shrink-0 w-10 h-10 rounded-full overflow-hidden"
          style={{ outline: `2px solid ${creator.brand_color}`, outlineOffset: '2px' }}
        >
          {creator.avatar_url ? (
            <Image
              src={creator.avatar_url}
              alt={creator.name}
              fill
              className="object-cover"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-white font-bold text-sm"
              style={{ backgroundColor: creator.brand_color }}
            >
              {creator.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Name + handle */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{creator.name}</p>
          <p className="text-xs text-zinc-400 truncate">{creator.handle}</p>
        </div>

        {/* Social links */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {creator.instagram_url && (
            <a
              href={creator.instagram_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-400 hover:text-white transition-colors"
              aria-label="Instagram"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>
          )}
          {creator.tiktok_url && (
            <a
              href={creator.tiktok_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-400 hover:text-white transition-colors"
              aria-label="TikTok"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.73a4.85 4.85 0 01-1.01-.04z"/>
              </svg>
            </a>
          )}
        </div>
      </div>
    </header>
  )
}
