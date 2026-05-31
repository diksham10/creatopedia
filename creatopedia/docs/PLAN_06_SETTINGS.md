# Phase 6 — Creator Settings Page

> **Run after Phase 5 is complete.**

---

## Objective

Build `/admin/settings` where the creator can:
- Update name, handle, bio
- Upload avatar → Supabase Storage
- Pick brand color (color picker)
- Set instagram_url, tiktok_url
- View subdomain (read-only)

---

## File Structure

```
app/
  (admin)/
    admin/
      settings/
        page.tsx
components/
  admin/
    SettingsForm.tsx   ← client component
app/
  api/
    creator/
      route.ts         ← GET me, PATCH update
```

---

## `app/api/creator/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { creatorSettingsSchema } from '@/lib/validations'

// GET /api/creator — fetch current creator
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase.from('creators').select('*').eq('id', user.id).single()
  return NextResponse.json(data)
}

// PATCH /api/creator — update creator settings
export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = creatorSettingsSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { data, error } = await supabase.from('creators')
    .update(parsed.data).eq('id', user.id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json(data)
}
```

---

## `app/(admin)/admin/settings/page.tsx`

```tsx
import { createClient } from '@/lib/supabase/server'
import SettingsForm from '@/components/admin/SettingsForm'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: creator } = await supabase.from('creators').select('*').eq('id', user!.id).single()

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-white mb-6">Settings</h1>
      <SettingsForm defaultValues={creator} />
    </div>
  )
}
```

---

## `components/admin/SettingsForm.tsx`

Client component with these sections:

### Profile Section
```tsx
// Fields: name, handle, bio (textarea)
// Avatar: click to upload → POST /api/upload → update avatar_url preview
```

### Branding Section
```tsx
// brand_color: <input type="color" /> with hex display
// Live preview: show a sample prompt card with the selected brand color
```

### Social Links Section
```tsx
// instagram_url, tiktok_url — text inputs with URL validation
```

### Subdomain (Read-only)
```tsx
<div className="bg-zinc-800 rounded-lg px-4 py-3">
  <p className="text-sm text-zinc-400">Your subdomain (read-only)</p>
  <p className="text-white font-mono">{creator.subdomain}.prompthub.app</p>
</div>
```

### Save Button
```tsx
async function handleSave(formData) {
  const res = await fetch('/api/creator', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData),
  })
  if (!res.ok) { /* show errors */ return }
  // Show success toast
}
```

---

## Avatar Upload Flow

```tsx
async function handleAvatarUpload(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  const res = await fetch('/api/upload', { method: 'POST', body: formData })
  const { url } = await res.json()
  setAvatarUrl(url) // update preview
  // Store in form state, saved with PATCH /api/creator
}
```

---

## Validation Checklist

- [ ] `/admin/settings` loads with current creator data pre-filled
- [ ] Name, handle, bio fields update and save correctly
- [ ] Avatar upload works: new image shows in preview and persists after refresh
- [ ] Brand color picker updates in real-time
- [ ] Instagram/TikTok URLs validate (must be valid URL or empty)
- [ ] Subdomain field is read-only
- [ ] Success toast shown after save
- [ ] Field-level validation errors shown for invalid inputs
- [ ] `npm run build` passes without errors
