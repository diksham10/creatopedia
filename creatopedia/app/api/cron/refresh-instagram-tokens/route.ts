import { NextResponse } from 'next/server'
import axios from 'axios'
import { API_BASE_URL } from '@/lib/api/config'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const resp = await axios.get(`${API_BASE_URL.replace(/\/$/, '')}/cron/refresh-instagram-tokens`, { headers: { authorization: authHeader || '' } })
    return NextResponse.json(resp.data)
  } catch (e) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
