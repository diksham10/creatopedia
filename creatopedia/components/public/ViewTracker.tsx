'use client'

import { useEffect } from 'react'
import { apiFetch } from '@/lib/api/client'

interface Props {
  pageId: string
  promptId?: string
  creatorId?: string
}

export default function ViewTracker({ pageId, promptId, creatorId }: Props) {
  useEffect(() => {
    const sessionId = sessionStorage.getItem('ph_sid') ?? crypto.randomUUID()
    sessionStorage.setItem('ph_sid', sessionId)

    apiFetch('/analytics/view', {
      method: 'POST',
      body: JSON.stringify({
        entity_id: promptId ?? pageId,
        entity_type: promptId ? 'prompt' : 'page',
        creator_id: creatorId,
        session_id: sessionId,
        metadata: {
          referrer: document.referrer,
          device: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
        },
      }),
    }).catch(() => {})
  }, [pageId, promptId, creatorId])

  return null
}
