import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { createClient } from '@/lib/supabase/cli'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function check() {
  const { data: { users } } = await supabase.auth.admin.listUsers()
  const milan = users.find(u => u.email === 'milan@creatopedia.tech')
  if (!milan) {
    console.log('User milan@creatopedia.tech not found')
    return
  }

  const { data: creator, error } = await supabase
    .from('creators')
    .select('*')
    .eq('id', milan.id)
    .single()

  if (error) {
    console.log('Creator record missing for Milan:', error.message)
  } else {
    console.log('Creator record found:', creator)
  }
}

check()
