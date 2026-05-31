import { createClient } from '@/lib/supabase/cli'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function run() {
  console.log('🚀 Running ad system fix...')

  // Fix the specific campaign
  const campaignId = 'a5754958-3ccf-4dd6-99cb-84edb74311a8'
  const { error } = await supabase.from('ad_placements').insert({
    campaign_id: campaignId,
    position: 'below_video',
    is_global: true
  })

  if (error) {
    if (error.message.includes('unique constraint')) {
      console.log('ℹ️ Note: Fix already applied.')
    } else {
      console.error('❌ Error:', error.message)
    }
  } else {
    console.log('✅ Fix applied to campaign: Genz Rocks')
  }

  // Debug current state
  const { data: campaigns } = await supabase.from('ad_campaigns').select('*, ad_placements(*)')
  console.log('Current Campaigns:', JSON.stringify(campaigns, null, 2))
}

run()
