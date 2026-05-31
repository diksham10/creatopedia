import Image from 'next/image'
import Link from 'next/link'

interface RelatedPrompt {
  id: string
  title: string
  slug: string
  ai_tool: string
  output_type: string
  thumbnail_url: string | null
}

interface Props {
  prompts: RelatedPrompt[]
  subdomain: string
  onPromptClick?: (prompt: RelatedPrompt) => void
}

const OUTPUT_ICONS: Record<string, string> = {
  image: '🖼️',
  video: '🎬',
  text: '📝',
  code: '💻',
  audio: '🎧',
}

export default function RelatedPrompts({ prompts, subdomain, onPromptClick }: Props) {
  if (!prompts.length) return null

  return (
    <section className="w-full">
      <h2 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-6 text-center">
        More from {subdomain}
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
        {prompts.map((p) => {
          const href = (() => {
            if (typeof window !== 'undefined') {
              const hostname = window.location.hostname
              const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN?.replace(/^https?:\/\//, '') || 'creatopedia.tech'
              const isSubdomain = hostname.startsWith(`${subdomain}.`)
              if (hostname === baseDomain || hostname === 'localhost' || hostname === '127.0.0.1' || !isSubdomain) {
                return `/${subdomain}/${p.slug}`
              }
              return `/${p.slug}`
            }
            return `/${subdomain}/${p.slug}`
          })()

          return (
            <Link
              key={p.id}
              href={href}
              onClick={(e) => {
                if (onPromptClick) {
                  e.preventDefault()
                  onPromptClick(p)
                }
              }}
              className="group flex flex-col gap-3 transition-all duration-300"
            >
            {/* Thumbnail */}
            <div className="aspect-[4/5] bg-zinc-900 relative rounded-xl overflow-hidden border border-zinc-800 shadow-sm group-hover:shadow-md transition-all group-hover:-translate-y-1">
              {p.thumbnail_url ? (
                <Image
                  src={p.thumbnail_url}
                  alt={p.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl">
                  {OUTPUT_ICONS[p.output_type] ?? '✨'}
                </div>
              )}
              <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors" />
            </div>

            {/* Info */}
            <div className="flex flex-col gap-1">
              <p className="text-sm font-bold text-zinc-200 line-clamp-2 leading-tight group-hover:text-indigo-400 transition-colors">{p.title}</p>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{p.ai_tool}</span>
                <span className="w-1 h-1 rounded-full bg-zinc-700" />
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{p.output_type}</span>
              </div>
            </div>
          </Link>
        )
      })}
      </div>
    </section>
  )
}
