// creatopedia/app/api/prompts/[id]/route.ts
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { API_BASE_URL } from '@/lib/api/config'
import { revalidateTag, revalidatePath } from 'next/cache'
import { Prompt } from '@/types'

interface Params { params: Promise<{ id: string }> }

async function getPromptAndVerifyOwner(id: string) {
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

  try {
    const contentType = req.headers.get('content-type') || ''
    const cookieHeader = (await cookies()).get('next-auth.session-token')?.value || ''
    let response: Response

    if (contentType.includes('application/json')) {
      // 1. DASHBOARD TOGGLE: Next.js drops FormData, so we force it into a strict URL string
      const jsonBody = await req.json()
      const urlParams = new URLSearchParams()
      Object.entries(jsonBody).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          urlParams.append(key, String(value))
        }
      })

      response = await fetch(`${API_BASE_URL.replace(/\/$/, '')}/prompts/${id}`, {
        method: 'PATCH',
        headers: {
          'Cookie': cookieHeader,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: urlParams.toString(), // <-- .toString() makes it impossible for Next.js to drop the body
      })

    } else if (contentType.includes('multipart/form-data')) {
      // 2. MAIN FORM: We bypass Next.js parsers completely and pipe the raw stream to FastAPI
      response = await fetch(`${API_BASE_URL.replace(/\/$/, '')}/prompts/${id}`, {
        method: 'PATCH',
        headers: {
          'Cookie': cookieHeader,
          'Content-Type': contentType, // MUST keep the original boundary from the browser
        },
        body: req.body, // <-- RAW STREAM!
        duplex: 'half',
      } as RequestInit)

    } else {
      throw new Error('Unsupported content type')
    }

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(errorText || 'Failed to update prompt')
    }

    const data = await response.json()

    // Revalidate caches
    revalidateTag(`prompt-${user.id}-${data.slug}`, 'max')
    revalidateTag(`prompts-list-${user.id}`, 'max')

    if (prompt.slug !== data.slug) {
      revalidateTag(`prompt-${user.id}-${prompt.slug}`, 'max')
    }

    try {
      if (user.subdomain) {
        revalidatePath(`/${user.subdomain}/${data.slug}`)
        if (prompt.slug !== data.slug) {
          revalidatePath(`/${user.subdomain}/${prompt.slug}`)
        }
      }
    } catch {}

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
    
    const response = await fetch(`${API_BASE_URL.replace(/\/$/, '')}/prompts/${id}`, {
      method: 'DELETE',
      headers: { cookie: cookieHeader },
    })

    if (!response.ok) throw new Error('Failed to delete prompt')

    revalidateTag(`prompt-${prompt.creator_id}-${prompt.slug}`, 'max')
    revalidateTag(`prompts-list-${prompt.creator_id}`, 'max')

    return NextResponse.json({ ok: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}