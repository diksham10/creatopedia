// Run with: npx ts-node scripts/seed-ads.ts
import { createClient } from '@/lib/supabase/cli'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function seedAds() {
  console.log('🌱 Seeding Ad System data...')

  // 1. Get first creator
  const { data: creators } = await supabase.from('creators').select('id').limit(1)
  if (!creators || creators.length === 0) {
    console.error('❌ No creators found. Run seed.ts first.')
    return
  }
  const creatorId = creators[0].id
  console.log('✅ Using creator:', creatorId)

  // 2. Create Ad Clients
  const clients = [
    {
      creator_id: creatorId,
      name: 'Nike Digital',
      email: 'ads@nike.com',
      company: 'Nike, Inc.',
      website: 'https://nike.com',
      status: 'active'
    },
    {
      creator_id: creatorId,
      name: 'Adobe Creative Cloud',
      email: 'partners@adobe.com',
      company: 'Adobe',
      website: 'https://adobe.com',
      status: 'active'
    }
  ]

  const { data: seededClients, error: clientsError } = await supabase
    .from('ad_clients')
    .upsert(clients, { onConflict: 'creator_id,name' })
    .select()

  if (clientsError) {
    console.error('❌ Clients error:', clientsError.message)
    return
  }
  console.log(`✅ Seeded ${seededClients.length} ad clients`)

  // 3. Create Ad Campaigns
  const nikeClient = seededClients.find(c => c.name === 'Nike Digital')
  const adobeClient = seededClients.find(c => c.name === 'Adobe Creative Cloud')

  const campaigns = [
    {
      creator_id: creatorId,
      client_id: nikeClient?.id,
      name: 'Summer Sale 2025',
      banner_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=1200&h=300',
      banner_alt: 'Nike Summer Shoes',
      target_url: 'https://nike.com/sale',
      utm_source: 'creatopedia',
      utm_medium: 'banner',
      utm_campaign: 'summer_sale_2025',
      status: 'active',
      report_token: Math.random().toString(36).substring(2, 15)
    },
    {
      creator_id: creatorId,
      client_id: adobeClient?.id,
      name: 'Adobe Max Early Bird',
      banner_url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=1200&h=300',
      banner_alt: 'Adobe Max Conference',
      target_url: 'https://max.adobe.com',
      utm_source: 'creatopedia',
      utm_medium: 'banner',
      utm_campaign: 'adobe_max_2025',
      status: 'scheduled',
      starts_at: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      report_token: Math.random().toString(36).substring(2, 15)
    }
  ]

  const { data: seededCampaigns, error: campaignsError } = await supabase
    .from('ad_campaigns')
    .upsert(campaigns, { onConflict: 'creator_id,name' })
    .select()

  if (campaignsError) {
    console.error('❌ Campaigns error:', campaignsError.message)
    return
  }
  console.log(`✅ Seeded ${seededCampaigns.length} campaigns`)

  // 4. Create Placements
  const summerCampaign = seededCampaigns.find(c => c.name === 'Summer Sale 2025')
  const maxCampaign = seededCampaigns.find(c => c.name === 'Adobe Max Early Bird')

  const placements = [
    {
      campaign_id: summerCampaign?.id,
      is_global: true,
      position: 'below_video'
    },
    {
      campaign_id: maxCampaign?.id,
      is_global: true,
      position: 'above_gate'
    }
  ]

  const { data: seededPlacements, error: placementsError } = await supabase
    .from('ad_placements')
    .upsert(placements)
    .select()

  if (placementsError) {
    console.error('❌ Placements error:', placementsError.message)
    return
  }
  console.log('✅ Seeded placements')

  // 5. Seed some dummy stats for the dashboard
  console.log('📊 Seeding dummy analytics...')
  const prompts = await supabase.from('prompts').select('id').eq('creator_id', creatorId).limit(5)
  const promptIds = prompts.data?.map(p => p.id) || []

  if (summerCampaign && promptIds.length > 0) {
    const impressions = []
    const clicks = []
    
    const placementId = seededPlacements?.[0]?.id

    for (let i = 0; i < 50; i++) {
      const date = new Date(Date.now() - Math.floor(Math.random() * 7) * 86400000)
      impressions.push({
        campaign_id: summerCampaign.id,
        placement_id: placementId,
        prompt_id: promptIds[Math.floor(Math.random() * promptIds.length)],
        ip_hash: `ip_${Math.random()}`,
        user_agent: 'Mozilla/5.0',
        created_at: date.toISOString()
      })
      
      if (Math.random() > 0.8) {
        clicks.push({
          campaign_id: summerCampaign.id,
          placement_id: placementId,
          prompt_id: promptIds[Math.floor(Math.random() * promptIds.length)],
          ip_hash: `ip_${Math.random()}`,
          user_agent: 'Mozilla/5.0',
          created_at: date.toISOString()
        })
      }
    }

    await supabase.from('ad_impressions').insert(impressions)
    await supabase.from('ad_clicks').insert(clicks)
    console.log('✅ Seeded dummy impressions and clicks')
  }

  console.log('\n✨ Ad System seed complete!')
}

seedAds()
