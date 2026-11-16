import { supabase } from './supabase'

export async function signInWithGoogle() {
  const redirectTo = `${window.location.origin}/`
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  })
}
