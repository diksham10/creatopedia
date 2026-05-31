import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { API_BASE_URL } from '@/lib/api/config'
import { promptSchema } from '@/lib/validations'
import { revalidateTag, revalidatePath } from 'next/cache'
import { Prompt } from '@/types'

interface Params { params: Promise<{ id: string }> }

async function getPromptAndVerifyOwner(id: string): Promise<{
  user: any | null,
  prompt: Prompt | null,
  unauthorized: boolean
}> {
  const cookieStore = await cookies()
  const cookieHeader = cookieStore.get('next-auth.session-token')?.value || ''

  try {
    const [promptResp, profileResp] = await Promise.all([
      axios.get(`${API_BASE_URL.replace(/\/$/, '')}/prompts/${id}`),
      axios.get(`${API_BASE_URL.replace(/\/$/, '')}/users/me/profile`, { headers: { cookie: cookieHeader } }).catch(() => null),
    ])

    const prompt = promptResp.data as Prompt
    const user = profileResp?.data ?? null

    if (!user || !prompt || String(prompt.creator_id) !== String(user.id)) {
      return { user, prompt: null, unauthorized: true }
    }

    return { user, prompt, unauthorized: false }
  } catch (e) {
    return { user: null, prompt: null, unauthorized: true }
  }
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const { prompt, unauthorized } = await getPromptAndVerifyOwner(id)
  if (unauthorized || !prompt) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json(prompt)
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params
  const { user, prompt, unauthorized } = await getPromptAndVerifyOwner(id)
  if (unauthorized || !user || !prompt) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const parsed = promptSchema.partial().safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const cookieHeader = (await cookies()).get('next-auth.session-token')?.value || ''
    const resp = await axios.patch(`${API_BASE_URL.replace(/\/$/, '')}/prompts/${id}`, parsed.data, { headers: { cookie: cookieHeader } })
    const data = resp.data

    // Invalidate cache tags
    revalidateTag(`prompt-${user.id}-${data.slug}`, 'max')
    revalidateTag(`prompts-list-${user.id}`, 'max')

    if (prompt.slug !== data.slug) {
      revalidateTag(`prompt-${user.id}-${prompt.slug}`, 'max')
    }

    // Revalidate public paths using user's subdomain
    try {
      const profileResp = await axios.get(`${API_BASE_URL.replace(/\/$/, '')}/users/me/profile`, { headers: { cookie: cookieHeader } })
      const creator = profileResp.data
      if (creator && creator.subdomain) {
        const revalidateUrl = `/${creator.subdomain}/${data.slug}`
        revalidatePath(revalidateUrl)
        if (prompt.slug !== data.slug) {
          revalidatePath(`/${creator.subdomain}/${prompt.slug}`)
        }
      }
    } catch {}

    // If newly published, ensure backend page record exists (backend handles this)

    return NextResponse.json(data)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const { prompt, unauthorized } = await getPromptAndVerifyOwner(id)
  if (unauthorized || !prompt) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  try {
    const cookieHeader = (await cookies()).get('next-auth.session-token')?.value || ''
    await axios.delete(`${API_BASE_URL.replace(/\/$/, '')}/prompts/${id}`, { headers: { cookie: cookieHeader } })

    revalidateTag(`prompt-${prompt.creator_id}-${prompt.slug}`, 'max')
    revalidateTag(`prompts-list-${prompt.creator_id}`, 'max')

    return NextResponse.json({ ok: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
