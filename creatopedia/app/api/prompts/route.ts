import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { API_BASE_URL } from '@/lib/api/config'
import { promptSchema } from '@/lib/validations'
import { revalidateTag } from 'next/cache'
import { Prompt } from '@/types'

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

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

  if (normalized.slug == null || normalized.slug === '') {
    normalized.slug = normalized.title ? slugify(String(normalized.title)) : undefined
  }

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

async function postPromptForm(
  path: string,
  data: Record<string, any>,
  cookieHeader: string,
  method: 'POST' | 'PATCH',
  formData?: FormData | null,
) {
  const body = formData ? new FormData(formData) : toFormBody(data)

  if (formData) {
    Object.entries(data).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return
      body.set(key, typeof value === 'boolean' ? String(value) : String(value))
    })
  }

  const response = await fetch(`${API_BASE_URL.replace(/\/$/, '')}${path}`, {
    method,
    headers: {
      cookie: cookieHeader,
      ...(formData ? {} : { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' }),
    },
    body,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(errorText || 'Request failed')
  }

  return response.json()
}

export async function GET() {
  const cookieHeader = (await cookies()).get('next-auth.session-token')?.value || ''
  if (!cookieHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const resp = await axios.get(`${API_BASE_URL.replace(/\/$/, '')}/prompts`, { headers: { cookie: cookieHeader } })
    return NextResponse.json(resp.data as Prompt[])
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const cookieHeader = (await cookies()).get('next-auth.session-token')?.value || ''
  if (!cookieHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { payload, formData } = await readPromptPayload(req)
  const normalizedBody = normalizePromptPayload(payload)
  const parsed = promptSchema.safeParse(normalizedBody)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const data = await postPromptForm('/prompts', parsed.data, cookieHeader, 'POST', formData)
    revalidateTag(`prompts-list-${data.creator_id}`, 'max')
    return NextResponse.json(data, { status: 201 })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
