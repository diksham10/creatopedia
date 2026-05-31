export interface AnalyticsSummary {
  total_views: number
  views_change_pct: number
  unique_visitors: number
  visitors_change_pct: number
  total_conversions: number
  conversions_change_pct: number
  total_revenue: number
  revenue_change_pct: number
}

export interface AnalyticsFunnel {
  views: number
  email_submissions: number
  prompt_unlocks: number
  copies: number
}

export interface DailyViewData {
  date: string
  views: number
  conversions: number
}

export interface TrafficSourceData {
  source: string
  sessions: number
  pct: number
}

export interface TopPromptData {
  id: string
  title: string
  slug: string
  gate_type: string
  views: number
  unique_views: number
  copies: number
  conversions: number
  revenue: number
  conv_rate: number
}

export interface TopCampaignData {
  id: string
  name: string
  status: string
  impressions: number
  unique_impressions: number
  clicks: number
  unique_clicks: number
  ctr: number
  frequency: number
}

export interface AnalyticsOverviewResponse {
  range: string
  summary: AnalyticsSummary
  daily_views: DailyViewData[]
  funnel: AnalyticsFunnel
  traffic_sources: TrafficSourceData[]
  top_prompts: TopPromptData[]
  top_campaigns: TopCampaignData[]
}

export interface PromptAnalyticsResponse {
  prompt: {
    id: string
    title: string
    slug: string
    ai_tool: string
    gate_type: string
  }
  summary: {
    views: number
    views_change_pct: number
    unique_views: number
    unique_views_change_pct: number
    copies: number
    copies_change_pct: number
    email_captures: number
    email_captures_change_pct: number
    unlocks: number
    unlocks_change_pct: number
    revenue: number
    revenue_change_pct: number
  }
  daily: {
    date: string
    views: number
    conversions: number
  }[]
  funnel: {
    views: number
    engaged: number
    email_submissions: number
    prompt_unlocks: number
    copies: number
  }
  traffic_sources: TrafficSourceData[]
  device_breakdown: {
    device: string
    count: number
    pct: number
  }[]
  ads: {
    campaign_id: string
    campaign_name: string
    impressions: number
    clicks: number
    ctr: number
  }[]
  email_captures: {
    email: string
    captured_at: string
    source: string
  }[]
}

export interface CampaignAnalyticsResponse {
  campaign: {
    id: string
    name: string
    status: string
    starts_at: string
    ends_at: string
    client_name: string
    report_token: string
  }
  summary: {
    impressions: number
    impressions_change_pct: number
    unique_impressions: number
    unique_impressions_change_pct: number
    clicks: number
    clicks_change_pct: number
    unique_clicks: number
    unique_clicks_change_pct: number
    ctr: number
    ctr_change_pct: number
    frequency: number
    frequency_change_pct: number
    total_prompt_views: number
  }
  daily: {
    date: string
    impressions: number
    clicks: number
  }[]
  placement_breakdown: {
    prompt_id: string
    prompt_title: string
    prompt_slug: string
    impressions: number
    views: number
    clicks: number
    ctr: number
  }[]
  device_breakdown: {
    device: string
    count: number
    pct: number
  }[]
  country_breakdown: {
    country: string
    count: number
    pct: number
  }[]
  hourly_heatmap: {
    day: number
    hour: number
    clicks: number
  }[]
  click_timeline: {
    timestamp: string
    prompt_title: string
    device: string
    country: string
  }[]
}
export interface AdReportResponse {
  total_impressions: number
  total_clicks: number
  total_unique_impressions: number
  total_unique_clicks: number
  frequency: number
  total_prompt_views: number
  total_view_time: number
  avg_view_duration: number
  ctr: number
  campaign_name: string
  campaign_status: string
  client_name: string | null
  starts_at: string
  ends_at: string | null
  daily_breakdown: {
    date: string
    impressions: number
    clicks: number
    view_time: number
  }[]
  per_prompt_breakdown: {
    prompt_id: string
    title: string
    slug: string
    impressions: number
    clicks: number
    view_time: number
    ctr: number
    avg_duration: number
    views: number
  }[]
  device_breakdown: {
    device: string
    count: number
    percentage: number
  }[]
  country_breakdown: {
    country: string
    count: number
    percentage: number
  }[]
}
