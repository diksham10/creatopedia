'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { clearTokens } from '@/lib/api/client'
import { 
  LayoutDashboard, 
  FileText, 
  BarChart3, 
  Settings, 
  LogOut,
  ExternalLink,
  Folder,
  Megaphone
} from 'lucide-react'

interface Props {
  creator: {
    name: string
    handle: string
    avatar_url: string | null
  }
}

export default function Sidebar({ creator }: Props) {
  const pathname = usePathname()
  const router = useRouter()

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Prompts', href: '/dashboard/prompts', icon: FileText },
    { label: 'Categories', href: '/dashboard/categories', icon: Folder },
    { label: 'Ads: Clients', href: '/dashboard/ads/clients', icon: Megaphone },
    { label: 'Ads: Campaigns', href: '/dashboard/ads/campaigns', icon: Megaphone },
    { label: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
    { label: 'Settings', href: '/dashboard/settings', icon: Settings },
  ]

  async function handleLogout() {
    clearTokens()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-72 bg-zinc-900 border-r border-zinc-800 flex flex-col h-full">
      {/* Logo */}
      <div className="p-8">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-white">
            P
          </div>
          <span className="text-xl font-bold tracking-tight text-white">
            Prompt<span className="text-indigo-500">Hub</span>
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group ${
                isActive 
                  ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' 
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800 border border-transparent'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-400' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer / Profile */}
      <div className="p-4 border-t border-zinc-800 space-y-4">
        <Link 
          href={`/${creator.handle.replace('@', '')}`}
          target="_blank"
          className="flex items-center justify-between w-full p-3 rounded-xl bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 transition-all text-xs font-semibold text-zinc-400"
        >
          <span>View Public Page</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>

        <div className="flex items-center gap-3 px-3">
          <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 overflow-hidden flex-shrink-0">
            {creator.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={creator.avatar_url} alt={creator.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-500 font-bold uppercase">
                {creator.name?.[0] || 'A'}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate">{creator.name}</p>
            <p className="text-xs text-zinc-500 truncate">{creator.handle}</p>
          </div>
          <button 
            onClick={handleLogout}
            className="p-2 text-zinc-500 hover:text-red-400 transition-colors"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </aside>
  )
}
