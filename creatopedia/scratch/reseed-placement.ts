import { createClient } from '@/lib/supabase/cli'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function run() {
  const CAMPAIGN_ID = 'a5754958-3ccf-4dd6-99cb-84edb74311a8'

  // Delete any stale placements first
  await supabase.from('ad_placements').delete().eq('campaign_id', CAMPAIGN_ID)

  // Insert a fresh global placement
  const { data, error } = await supabase.from('ad_placements').insert({
    campaign_id: CAMPAIGN_ID,
    is_global: true,
    position: 'below_video',
    prompt_id: null,
    category_id: null,
  }).select()

  if (error) {
    console.error('❌ Failed to insert placement:', error.message)
  } else {
    console.log('✅ Placement created:', JSON.stringify(data, null, 2))
  }
}

run()
