import { createClient } from '@/lib/supabase/cli'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function check() {
  const { data, error } = await supabase.from('creators').select('*').limit(1)
  if (data && data.length > 0) {
    console.log('Columns:', Object.keys(data[0]))
  } else {
    console.log('No data or error:', error)
  }
}

check()
