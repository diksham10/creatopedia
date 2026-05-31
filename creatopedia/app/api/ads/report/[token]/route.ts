import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { API_BASE_URL } from '@/lib/api/config'

interface Params { params: Promise<{ token: string }> }

export async function GET(req: NextRequest, { params }: Params) {
  const { token } = await params
  const { searchParams } = new URL(req.url)
  const range = searchParams.get('range') || '30d'
  const month = searchParams.get('month')

  try {
    const resp = await axios.get(`${API_BASE_URL.replace(/\/$/, '')}/ads/report/${token}`, { params: { range, month } })
    return NextResponse.json(resp.data)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

