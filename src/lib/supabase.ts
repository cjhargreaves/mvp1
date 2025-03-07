import { createClient } from '@supabase/supabase-js'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.error('Missing env.NEXT_PUBLIC_SUPABASE_URL');
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false
  },
  db: {
    schema: 'public'
  }
}) 
