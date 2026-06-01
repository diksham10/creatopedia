import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { API_BASE_URL } from '@/lib/api/config'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const creatorId = searchParams.get('creator_id')
  const promptId = searchParams.get('prompt_id')
  const pageType = searchParams.get('page_type')
  const categoryId = searchParams.get('category_id')

  if (!creatorId) {
    return NextResponse.json({ error: 'creator_id required' }, { status: 400 })
  }

  try {
    const resp = await axios.get(`${API_BASE_URL.replace(/\/$/, '')}/public/ads/placements`, {
      params: {
        creator_id: creatorId,
        ...(promptId ? { prompt_id: promptId } : {}),
        ...(pageType ? { page_type: pageType } : {}),
        ...(categoryId ? { category_id: categoryId } : {}),
      },
    })
    return NextResponse.json(resp.data)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
