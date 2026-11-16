import { supabase } from './supabase'

export async function signInWithGoogle() {
  const redirectTo = `${window.location.origin}/`
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      skipBrowserRedirect: false,
    },
  })
}

/** Lê erro do OAuth na URL e limpa a query. */
export function consumeAuthRedirectError(): string | null {
  const url = new URL(window.location.href)
  const error = url.searchParams.get('error_description') || url.searchParams.get('error')
  if (!error && !url.searchParams.get('code')) return null

  if (error || url.searchParams.has('error_code')) {
    url.search = ''
    window.history.replaceState({}, '', url.pathname)
    return decodeURIComponent(error || 'Falha no login com Google')
  }
  return null
}
