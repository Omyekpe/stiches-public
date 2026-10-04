import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  console.warn(
    'Supabase env vars missing — copy .env.example to .env and fill in your project URL/anon key.'
  )
}

// Fall back to a placeholder so createClient doesn't throw and blank the app
// before .env is set up — real requests will just fail until it's configured.
export const supabase = createClient(
  url || 'https://placeholder.supabase.co',
  anonKey || 'placeholder-anon-key'
)
