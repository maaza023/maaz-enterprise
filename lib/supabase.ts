import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabaseClient = createClient(supabaseUrl, supabaseKey)

// Cache client in global scope to prevent duplicate GoTrueClient instances on hot-reload
const globalForSupabase = globalThis as unknown as {
  supabase: typeof supabaseClient | undefined
}

export const supabase = globalForSupabase.supabase ?? supabaseClient

if (process.env.NODE_ENV !== 'production') {
  globalForSupabase.supabase = supabase
}