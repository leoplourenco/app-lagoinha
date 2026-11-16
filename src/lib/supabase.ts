import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anon) {
  console.warn(
    'Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env (veja .env.example).',
  )
}

export const supabase = createClient(url || 'https://placeholder.supabase.co', anon || 'placeholder')

export const hasSupabaseConfig = Boolean(url && anon)
