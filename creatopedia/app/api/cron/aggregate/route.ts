import { NextRequest } from 'next/server'
import axios from 'axios'
import { API_BASE_URL } from '@/lib/api/config'

export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    await axios.post(`${API_BASE_URL.replace(/\/$/, '')}/cron/aggregate`, {}, { headers: { authorization: req.headers.get('authorization') || '' } })
    return Response.json({ ok: true, ran_at: new Date().toISOString() })
  } catch (e) {
    return Response.json({ error: 'failed' }, { status: 500 })
  }
}
