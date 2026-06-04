import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { cookies } from 'next/headers'
import { API_BASE_URL } from '@/lib/api/config'
import { PromptAnalyticsResponse } from '@/lib/analytics/types'

interface PromptStatsRow {
  date: string
  views: number
  unique_views: number
  copies: number
  email_captures: number
  email_unlocks: number
  payment_unlocks: number
  revenue: number
}

interface JoinedCampaign {
  name: string
}

interface Params { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: Params) {
  const { id: promptId } = await params
  const cookieHeader = (await cookies()).get('next-auth.session-token')?.value || ''
  if (!cookieHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const qs = url.search
  try {
    const resp = await axios.get(`${API_BASE_URL.replace(/\/$/, '')}/analytics/prompts/${promptId}${qs}`, { headers: { cookie: cookieHeader } })
    return NextResponse.json(resp.data, { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
