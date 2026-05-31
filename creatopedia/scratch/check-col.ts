import { createClient } from '@/lib/supabase/cli'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function run() {
  const { data, error } = await supabase.from('ad_placements').select('category_id').limit(1)
  if (error) {
    console.log('COLUMN MISSING OR TABLE ERROR:', error.message)
  } else {
    console.log('COLUMN EXISTS')
  }
}

run()
