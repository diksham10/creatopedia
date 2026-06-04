import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { API_BASE_URL } from '@/lib/api/config'
import { z } from 'zod'

const adClientUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  company: z.string().max(100).optional().nullable().or(z.literal('')),
  email: z.string().email().optional().nullable().or(z.literal('')),
  phone: z.string().max(30).optional().nullable().or(z.literal('')),
  website: z.string().url().optional().nullable().or(z.literal('')),
  notes: z.string().max(1000).optional().nullable().or(z.literal('')),
  status: z.enum(['active', 'inactive']).optional(),
})

interface Params { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params
  const cookieHeader = req.headers.get('cookie') || ''
  if (!cookieHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const resp = await axios.get(`${API_BASE_URL.replace(/\/$/, '')}/ads/clients/${id}`, { headers: { cookie: cookieHeader } })
    const mapped = {
      ...resp.data,
      status: resp.data.status === 'paused' ? 'inactive' : resp.data.status,
    }
    return NextResponse.json(mapped)
  } catch (e) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params
  const cookieHeader = req.headers.get('cookie') || ''
  if (!cookieHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = adClientUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  try {
    const patchPayload: any = { ...parsed.data }
    if (patchPayload.status) {
      patchPayload.status = patchPayload.status === 'inactive' ? 'paused' : patchPayload.status
    }
    const resp = await axios.patch(
      `${API_BASE_URL.replace(/\/$/, '')}/ads/clients/${id}`,
      { ...patchPayload, updated_at: new Date().toISOString() },
      { headers: { cookie: cookieHeader } }
    )
    const mapped = {
      ...resp.data,
      status: resp.data.status === 'paused' ? 'inactive' : resp.data.status,
    }
    return NextResponse.json(mapped)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { id } = await params
  const cookieHeader = req.headers.get('cookie') || ''
  if (!cookieHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    await axios.delete(`${API_BASE_URL.replace(/\/$/, '')}/ads/clients/${id}`, { headers: { cookie: cookieHeader } })
    return NextResponse.json({ success: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
