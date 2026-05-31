import { createClient } from '@/lib/supabase/cli'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function check() {
  const { data: creator } = await supabase
    .from('creators')
    .select('*')
    .or('handle.eq.@milanray.design,subdomain.eq.milan')
    .single()

  if (!creator) {
    console.log('❌ Creator Milan not found')
    return
  }

  console.log('✅ Creator found:', creator.id, creator.handle)
  console.log('Ads enabled:', creator.ads_enabled)
  console.log('Ad frequency:', creator.ad_frequency)

  const { data: ads } = await supabase
    .from('ad_placements')
    .select('*, campaign:ad_campaigns(*)')
    .or(`creator_id.eq.${creator.id},is_global.eq.true`)

  console.log('\n--- Ad Placements ---')
  console.log(JSON.stringify(ads, null, 2))
}

check()
