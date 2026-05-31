# Phase 4 — Prompt CRUD (List, Create, Edit, Delete)

> **Run after Phase 3 is complete.**

---

## Objective

Full prompt management inside the admin:
- List page: table of all prompts with actions
- Create page: new prompt form
- Edit page: edit existing prompt
- API routes: GET list, POST create, PATCH update, DELETE
- File upload to Supabase Storage (thumbnail)
- Auto-slug generation from title

---

## File Structure to Create

```
app/
  (admin)/
    admin/
      prompts/
        page.tsx          ← List all prompts
        new/
          page.tsx        ← Create prompt
        [id]/
          page.tsx        ← Edit prompt
  api/
    prompts/
      route.ts            ← GET list, POST create
      [id]/
        route.ts          ← GET one, PATCH, DELETE
    upload/
      route.ts            ← POST multipart upload
components/
  admin/
    PromptTable.tsx
    PromptForm.tsx
```

---

## API Routes

### `app/api/prompts/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { promptSchema } from '@/lib/validations'

// GET /api/prompts — list creator's prompts
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase.from('prompts').select('*')
    .eq('creator_id', user.id).order('created_at', { ascending: false })
  return NextResponse.json(data)
}

// POST /api/prompts — create prompt
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = promptSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { data, error } = await supabase.from('prompts')
    .insert({ ...parsed.data, creator_id: user.id }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // If published, create page record
  if (parsed.data.status === 'published') {
    await supabase.from('pages').insert({ prompt_id: data.id })
  }

  return NextResponse.json(data, { status: 201 })
}
```

### `app/api/prompts/[id]/route.ts`

```typescript
// PATCH — update prompt
// DELETE — delete prompt
// Same auth pattern: verify user owns the prompt before modifying
```

### `app/api/upload/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/cli'

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('file') as File
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

  const ALLOWED = ['image/jpeg', 'image/png', 'image/webp']
  if (!ALLOWED.includes(file.type)) return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: 'Max 5MB' }, { status: 400 })

  const ext = file.name.split('.').pop()
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const buffer = await file.arrayBuffer()

  const { error } = await adminClient.storage
    .from('media').upload(filename, buffer, { contentType: file.type })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: { publicUrl } } = adminClient.storage.from('media').getPublicUrl(filename)
  return NextResponse.json({ url: publicUrl })
}
```

---

## `components/admin/PromptForm.tsx`

Client component used for both create and edit. Fields:

| Field | Type | Notes |
|-------|------|-------|
| `title` | text input | Required |
| `category` | select | Video Generation, Image Creation, Brand & Logo, Education, Scriptwriting, Photo Editing, Other — **Required** |
| `description` | textarea | Optional |
| `content` | large textarea | Required — the actual prompt |
| `ai_tool` | select | Midjourney, Claude, ChatGPT, Gemini, Runway, Pika, Kling, Veo, Other |
| `output_type` | select | image, video, text, code, audio |
| `gate_type` | radio | open, email, payment |
| `price` | number | Only visible when gate_type=payment |
| `slug` | text | Auto-generated from title, editable |
| `video_url` | text | Paste Instagram/TikTok URL |
| `thumbnail` | file | Upload → `/api/upload` → store URL |
| `status` | toggle | Draft / Published |

**Slug auto-generation:**
```typescript
function toSlug(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}
// Auto-fill slug on title change, but allow manual override
```

**Form submission:**
- Create: `POST /api/prompts`
- Edit: `PATCH /api/prompts/[id]`
- Show Zod field-level errors below each input

---

## `app/(admin)/admin/prompts/page.tsx`

```tsx
// Server component
// Fetch prompts from Supabase directly (not via API route)
// Render <PromptTable prompts={prompts} />
```

## `components/admin/PromptTable.tsx`

Client component. Table columns:
- Title
- AI Tool (badge)
- Gate Type (badge: open=green, email=blue, payment=amber)
- Status (badge: published=emerald, draft=zinc)
- Created At (relative time)
- Actions: Edit link, Publish/Unpublish button, Delete button (with confirm)

---

## `app/(admin)/admin/prompts/new/page.tsx`

```tsx
import PromptForm from '@/components/admin/PromptForm'
export default function NewPromptPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-white mb-6">New Prompt</h1>
      <PromptForm />
    </div>
  )
}
```

## `app/(admin)/admin/prompts/[id]/page.tsx`

```tsx
// Fetch existing prompt server-side, pass as defaultValues to PromptForm
```

---

## Validation Checklist

- [ ] `/admin/prompts` lists all prompts in a table
- [ ] "New Prompt" button → `/admin/prompts/new`
- [ ] Create form: slug auto-fills from title
- [ ] Create form: price field only appears for payment gate
- [ ] Thumbnail upload works (file → Supabase Storage → URL stored)
- [ ] Form shows field-level validation errors
- [ ] Save creates prompt and redirects to list
- [ ] Edit page pre-fills form with existing data
- [ ] Publish/Unpublish toggle updates status
- [ ] Delete removes prompt (with confirmation)
- [ ] `npm run build` passes without errors
