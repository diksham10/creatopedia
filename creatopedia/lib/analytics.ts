import { apiFetch } from '@/lib/api/client'

export interface AnalyticsStats {
  dailyViews: { date: string; views: number }[]
  promptStats: { title: string; copies: number; email_captures: number }[]
  topByViews: { id: string; title: string; slug: string; view_count: number }[]
  topByConversion: { id: string; title: string; slug: string; view_count: number; conversion_rate: string }[]
  topCampaigns: { id: string; name: string; status: string; impressions: number; clicks: number }[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  recentCaptures: any[]
  systemStats: {
    totalUsers?: number
    totalPrompts: number
    activePrompts: number
    totalCategories: number
    activeCampaigns: number
  }
  engagement: {
    avgConversionRate: number
    totalUniqueVisitors: number
    totalRevenue: number
  }
  trendingPrompts: { id: string; title: string; slug: string; growth: number }[]
  trafficSources: { source: string; count: number }[]
}

export async function getAggregatedStats(): Promise<AnalyticsStats> {
  const overview = await apiFetch<{
    prompt_views: number
    prompt_copies: number
    ad_impressions: number
    ad_clicks: number
    email_captures: number
    prompts_created: number
    published_prompts?: number
    total_prompts?: number
    active_campaigns?: number
    unique_visitors?: number
  }>('/analytics/overview')

  const daily = await apiFetch<{ date: string; views: number }[]>(
    '/analytics/daily?days=7'
  )

  const views = overview.prompt_views || 0
  const copies = overview.prompt_copies || 0

  return {
    dailyViews: (daily || []).map((d) => ({ date: d.date, views: d.views })),
    promptStats: [],
    topByViews: [],
    topByConversion: [],
    topCampaigns: [],
    recentCaptures: [],
    systemStats: {
      totalPrompts: overview.total_prompts ?? overview.prompts_created ?? 0,
      activePrompts: overview.published_prompts ?? 0,
      totalCategories: 0,
      activeCampaigns: overview.active_campaigns ?? 0,
    },
    engagement: {
      avgConversionRate: views > 0 ? (copies / views) * 100 : 0,
      totalUniqueVisitors: overview.unique_visitors ?? 0,
      totalRevenue: 0,
    },
    trendingPrompts: [],
    trafficSources: [],
  }
}

/**
 * CLIENT-SIDE TRACKING FUNCTIONS
 */

export const trackCopy = (promptId: string) => {
  apiFetch('/analytics/event', {
    method: 'POST',
    body: JSON.stringify({
      event_type: 'copy',
      entity_id: promptId,
      entity_type: 'prompt',
      session_id: sessionStorage.getItem('ph_sid'),
    }),
  }).catch(() => {})
}

export const trackEmailSubmit = (promptId: string) => {
  apiFetch('/analytics/event', {
    method: 'POST',
    body: JSON.stringify({
      event_type: 'email_capture',
      entity_id: promptId,
      entity_type: 'prompt',
      session_id: sessionStorage.getItem('ph_sid'),
    }),
  }).catch(() => {})
}
