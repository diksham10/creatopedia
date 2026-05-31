import { createClient } from '@/lib/supabase/cli'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function check() {
  const { data: { users }, error } = await supabase.auth.admin.listUsers()
  if (error) {
    console.error('Error listing users:', error)
  } else {
    console.log('Found users:', users.map(u => u.email))
  }
}

check()
