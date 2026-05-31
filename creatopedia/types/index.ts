export type PlanTier = 'free' | 'creator' | 'pro'
export type GateType = 'open' | 'email' | 'payment'
export type PromptStatus = 'draft' | 'published'
export type OutputType = 'image' | 'video' | 'text' | 'code' | 'audio'
export type AiTool = 'Midjourney' | 'Claude' | 'ChatGPT' | 'Gemini' | 'Runway' | 'Pika' | 'Kling' | 'Veo' | 'Other'
export type PromptCategory = 'Video Generation' | 'Image Creation' | 'Brand & Logo' | 'Education' | 'Scriptwriting' | 'Photo Editing' | 'Other'

export interface Creator {
  id: string
  email: string
  name: string
  handle: string
  subdomain: string
  avatar_url: string | null
  brand_color: string
  bio: string | null
  instagram_url: string | null
  tiktok_url: string | null
  instagram_api_key?: string | null
  instagram_app_id?: string | null
  instagram_app_secret?: string | null
  tiktok_api_key?: string | null
  stripe_id: string | null
  plan_tier: PlanTier
  ad_frequency: number | null
  ads_enabled: boolean
  created_at: string
}

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  image_url: string | null
  featured: boolean
  created_at: string
}

export interface Prompt {
  id: string
  creator_id: string
  title: string
  category_id: string
  description: string | null
  content: string
  video_url: string | null
  embed_html: string | null
  thumbnail_url: string | null
  share_image_url: string | null
  ai_tool: string
  output_type: OutputType
  gate_type: GateType
  price: number | null
  slug: string
  status: PromptStatus
  featured: boolean
  content_type: 'prompt' | 'pdf'
  pdf_url: string | null
  created_at: string
}

export interface Page {
  id: string
  prompt_id: string
  published_at: string
}

export interface EmailCapture {
  id: string
  prompt_id: string
  email: string
  captured_at: string
}

// ── Ad System Types ────────────────────────────────────────────

export type AdClientStatus = 'active' | 'inactive'
export type AdCampaignStatus = 'active' | 'paused' | 'ended' | 'scheduled'
export type AdPlacementPosition = 'above_media' | 'above_prompt' | 'below_prompt' | 'popup' | 'creator_page' | 'marketplace' | 'discovery_hub' | 'discovery_header_banner' | string

export interface AdClient {
  id: string
  creator_id: string
  name: string
  email: string | null
  phone: string | null
  company: string | null
  website: string | null
  notes: string | null
  status: AdClientStatus
  created_at: string
  updated_at: string
}

export interface AdCampaign {
  id: string
  creator_id: string
  client_id: string | null
  name: string
  banner_url: string
  banner_alt: string | null
  target_url: string
  utm_source: string
  utm_medium: string
  utm_campaign: string | null
  client_webhook_url: string | null
  report_token: string
  status: AdCampaignStatus
  starts_at: string | null
  ends_at: string | null
  created_at: string
  updated_at: string
  // Joined fields
  client?: AdClient
  ad_placements?: AdPlacement[]
  impressions_count?: number
  clicks_count?: number
}

export interface AdPlacement {
  id: string
  campaign_id: string
  prompt_id: string | null
  category_id: string | null
  position: AdPlacementPosition
  is_global: boolean
  creator_id: string | null
  created_at: string
  campaign?: AdCampaign
}

export interface AdStats {
  total_impressions: number
  total_clicks: number
  ctr: number
  campaign_name: string
  campaign_status: AdCampaignStatus
  client_name: string | null
  starts_at: string | null
  ends_at: string | null
  daily_breakdown: { date: string; impressions: number; clicks: number }[]
  per_prompt_breakdown: {
    prompt_id: string
    title: string
    slug: string
    impressions: number
    clicks: number
    ctr: number
  }[]
  device_breakdown: { device: string; count: number; percentage: number }[]
  country_breakdown: { country: string; count: number; percentage: number }[]
}
