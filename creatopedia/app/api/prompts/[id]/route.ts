import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { API_BASE_URL } from '@/lib/api/config'
import { revalidateTag, revalidatePath } from 'next/cache'
import { Prompt } from '@/types'

interface Params { params: Promise<{ id: string }> }

async function readPromptPayload(req: NextRequest) {
  const contentType = req.headers.get('content-type') ?? ''

  if (contentType.includes('multipart/form-data')) {
    const formData = await req.formData()
    const payload: Record<string, any> = {}
    formData.forEach((value, key) => {
      if (typeof value === 'string') payload[key] = value
    })
    return { payload, formData }
  }

  return { payload: await req.json(), formData: null }
}

function normalizePromptPayload(body: Record<string, any>) {
  const normalized: Record<string, any> = { ...body }

  if (typeof normalized.price === 'string') {
    const parsedPrice = Number.parseFloat(normalized.price)
    normalized.price = Number.isFinite(parsedPrice) ? parsedPrice : undefined
  }

  if (typeof normalized.featured === 'string') {
    normalized.featured = normalized.featured === 'true'
  }

  return normalized
}

function toFormBody(data: Record<string, any>) {
  const form = new URLSearchParams()

  Object.entries(data).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    form.set(key, typeof value === 'boolean' ? String(value) : String(value))
  })

  return form
}

async function sendPromptForm(path: string, data: Record<string, any>, cookieHeader: string, method: 'PATCH' | 'DELETE') {
  if (method === 'DELETE') {
    const response = await fetch(`${API_BASE_URL.replace(/\/$/, '')}${path}`, {
      method,
      headers: { cookie: cookieHeader },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(errorText || 'Request failed')
    }

    if (response.status === 204) {
      return null
    }

    return response.json()
  }

  const response = await fetch(`${API_BASE_URL.replace(/\/$/, '')}${path}`, {
    method,
    headers: {
      cookie: cookieHeader,
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
    },
    body: toFormBody(data),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(errorText || 'Request failed')
  }

  if (response.status === 204) {
    return null
  }

  return response.json()
}

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

  const { payload, formData } = await readPromptPayload(req)
  console.log('=== PATCH /prompts/[id] ===')
  console.log('Received payload:', payload)
  console.log('Has formData:', !!formData)
  if (formData) {
    console.log('FormData entries:')
    const entries: Record<string, any> = {}
    formData.forEach((value, key) => {
      entries[key] = value instanceof File ? `[File: ${value.name}]` : value
    })
    console.log(entries)
  }
  
  const normalizedBody = normalizePromptPayload(payload)
  console.log('After normalization:', normalizedBody)

  try {
    const cookieHeader = (await cookies()).get('next-auth.session-token')?.value || ''
    let data

    if (formData) {
      const body = new FormData()
      formData.forEach((value, key) => {
        body.append(key, value)
      })
      Object.entries(normalizedBody).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') return
        body.set(key, typeof value === 'boolean' ? String(value) : String(value))
      })

      const response = await fetch(`${API_BASE_URL.replace(/\/$/, '')}/prompts/${id}`, {
        method: 'PATCH',
        headers: { cookie: cookieHeader },
        body,
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'Request failed')
      }

      data = await response.json()
    } else {
      data = await sendPromptForm(`/prompts/${id}`, normalizedBody, cookieHeader, 'PATCH')
    }

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
    await sendPromptForm(`/prompts/${id}`, {}, cookieHeader, 'DELETE')

    revalidateTag(`prompt-${prompt.creator_id}-${prompt.slug}`, 'max')
    revalidateTag(`prompts-list-${prompt.creator_id}`, 'max')

    return NextResponse.json({ ok: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
