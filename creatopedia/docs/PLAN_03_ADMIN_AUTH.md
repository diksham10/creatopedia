# Phase 3 — Admin Auth (Supabase Login + Protected Routes)

> **Run after Phase 2 is complete.**

---

## Objective

- Login page at `/login`
- Supabase email+password auth
- Middleware already protects `/admin/*` (done in Phase 1)
- Admin shell layout with sidebar
- Logout functionality

---

## File Structure to Create

```
app/
  login/
    page.tsx          ← Login form (client component)
  (admin)/
    layout.tsx        ← Admin shell with Sidebar
    admin/
      page.tsx        ← Dashboard home (stats overview stub)
components/
  admin/
    Sidebar.tsx
    StatsCard.tsx
```

---

## `app/login/page.tsx`

```tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false); return }
    router.push('/admin')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950">
      <form onSubmit={handleLogin} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold text-white">Sign in to PromptHub</h1>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
          className="w-full px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white" required />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)}
          className="w-full px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white" required />
        <button type="submit" disabled={loading}
          className="w-full py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold disabled:opacity-50">
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
      </form>
    </div>
  )
}
```

---

## `app/(admin)/layout.tsx`

```tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/admin/Sidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: creator } = await supabase
    .from('creators').select('name,avatar_url,subdomain').eq('id', user.id).single()

  return (
    <div className="flex min-h-screen bg-zinc-950">
      <Sidebar creator={creator} />
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  )
}
```

---

## `components/admin/Sidebar.tsx`

Client component. Navigation links:
- `/admin` — Dashboard (icon: chart)
- `/admin/prompts` — Prompts (icon: document)
- `/admin/analytics` — Analytics (icon: bar chart)
- `/admin/settings` — Settings (icon: gear)

Bottom: creator avatar + name + logout button.

Logout:
```tsx
const supabase = createClient()
await supabase.auth.signOut()
router.push('/login')
router.refresh()
```

---

## `app/(admin)/admin/page.tsx`

Dashboard home stub — shows 4 stats cards with 0 values (real data comes in Phase 5):

```tsx
import { createClient } from '@/lib/supabase/server'
import StatsCard from '@/components/admin/StatsCard'

export default async function AdminDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch counts
  const [{ count: totalPrompts }, { count: totalCaptures }] = await Promise.all([
    supabase.from('prompts').select('*', { count: 'exact', head: true }).eq('creator_id', user!.id),
    supabase.from('email_captures').select('*', { count: 'exact', head: true }),
  ])

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Dashboard</h1>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatsCard label="Total Prompts" value={totalPrompts ?? 0} />
        <StatsCard label="Email Captures" value={totalCaptures ?? 0} />
        <StatsCard label="Views (7d)" value={0} />
        <StatsCard label="Copy Events" value={0} />
      </div>
    </div>
  )
}
```

---

## `components/admin/StatsCard.tsx`

```tsx
interface Props { label: string; value: number; change?: number }

export default function StatsCard({ label, value, change }: Props) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <p className="text-sm text-zinc-400">{label}</p>
      <p className="text-3xl font-bold text-white mt-1">{value.toLocaleString()}</p>
      {change !== undefined && (
        <p className={`text-sm mt-1 ${change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {change >= 0 ? '+' : ''}{change}% vs last 7d
        </p>
      )}
    </div>
  )
}
```

---

## Validation Checklist

- [ ] `/login` renders a clean login form
- [ ] Invalid credentials show error message
- [ ] Valid login redirects to `/admin`
- [ ] Unauthenticated access to `/admin` redirects to `/login`
- [ ] Sidebar shows all nav links with active state
- [ ] Logout button signs out and redirects to `/login`
- [ ] Dashboard shows stats cards
- [ ] `npm run build` passes without errors
