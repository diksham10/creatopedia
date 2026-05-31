import { NextRequest, NextResponse } from 'next/server'
import { trackEvent } from '@/lib/analytics/track'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    if (body.prompt_id && body.session_id) {
      trackEvent({
        event_type: 'prompt_view',
        creator_id: body.creator_id ?? undefined,
        prompt_id: body.prompt_id,
        session_id: body.session_id,
        request: req,
      })
    }
  } catch (err) {
    console.error('[analytics/view] error:', err)
  }
  
  return NextResponse.json({ ok: true })
}
