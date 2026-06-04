import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { API_BASE_URL } from '@/lib/api/config'
import { z } from 'zod'

const adClientSchema = z.object({
  name: z.string().min(1, 'Client name is required').max(100),
  company: z.string().max(100).optional().nullable().or(z.literal('')),
  email: z.string().email().optional().nullable().or(z.literal('')),
  phone: z.string().max(30).optional().nullable().or(z.literal('')),
  website: z.string().url().optional().nullable().or(z.literal('')),
  notes: z.string().max(1000).optional().nullable().or(z.literal('')),
  status: z.enum(['active', 'inactive']).default('active'),
})

export async function GET(req: NextRequest) {
  const cookieHeader = req.headers.get('cookie') || ''
  if (!cookieHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const resp = await axios.get(`${API_BASE_URL.replace(/\/$/, '')}/ads/clients`, { headers: { cookie: cookieHeader } })
    const data = resp.data || []
    const enriched = (data ?? []).map((c: any) => ({
      ...c,
      status: c.status === 'paused' ? 'inactive' : c.status,
      active_campaigns: (c.ad_campaigns ?? []).filter((cam: { status: string }) => cam.status === 'active').length,
      ad_campaigns: undefined,
    }))
    return NextResponse.json(enriched)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const cookieHeader = req.headers.get('cookie') || ''
  if (!cookieHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = adClientSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  try {
    // Backend currently expects only { name, company?, email, status }.
    // The admin UI sends additional optional fields; we intentionally strip them here.
    // Also coerce nullable/optional `email` into a string to avoid backend 422s.
    const payload = {
      name: parsed.data.name,
      company: parsed.data.company ?? null,
      email: (parsed.data.email ?? '') as string,
      status: parsed.data.status === 'inactive' ? 'paused' : parsed.data.status,
    }
    const resp = await axios.post(
      `${API_BASE_URL.replace(/\/$/, '')}/ads/clients`,
      payload,
      { headers: { cookie: cookieHeader } }
    )
    const mappedResponse = {
      ...resp.data,
      status: resp.data.status === 'paused' ? 'inactive' : resp.data.status,
    }
    return NextResponse.json(mappedResponse, { status: 201 })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
