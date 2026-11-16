import { useState } from 'react'
import { Button } from './ui/button'
import { signInWithGoogle } from '../lib/auth'
import { hasSupabaseConfig } from '../lib/supabase'

export function GoogleSignInButton({
  label = 'Continuar com Google',
}: {
  label?: string
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onClick() {
    setError(null)
    if (!hasSupabaseConfig) {
      setError('Supabase não configurado.')
      return
    }
    setLoading(true)
    const { error: err } = await signInWithGoogle()
    if (err) {
      setLoading(false)
      setError(err.message)
    }
    // Se ok, o browser redireciona para o Google
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        className="w-full border-white/20 bg-white text-black hover:bg-white/90"
        size="lg"
        disabled={loading}
        onClick={() => void onClick()}
      >
        <GoogleIcon />
        {loading ? 'Abrindo Google…' : label}
      </Button>
      {error ? <p className="text-center text-sm text-rose-300">{error}</p> : null}
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
      <path
        fill="#EA4335"
        d="M12 10.2v3.6h5.1c-.2 1.2-1.5 3.6-5.1 3.6-3.1 0-5.6-2.5-5.6-5.6S8.9 6.2 12 6.2c1.8 0 3 .7 3.7 1.4l2.5-2.4C16.8 3.8 14.6 2.8 12 2.8 6.9 2.8 2.8 6.9 2.8 12S6.9 21.2 12 21.2c5.5 0 9.1-3.9 9.1-9.3 0-.6-.1-1.1-.2-1.7H12z"
      />
      <path
        fill="#34A853"
        d="M3.9 7.4 6.9 9.6C7.7 7.6 9.7 6.2 12 6.2c1.8 0 3 .7 3.7 1.4l2.5-2.4C16.8 3.8 14.6 2.8 12 2.8 8.4 2.8 5.3 4.8 3.9 7.4z"
        opacity="0"
      />
      <path
        fill="#4285F4"
        d="M12 21.2c2.4 0 4.5-.8 6-2.2l-2.9-2.2c-.8.6-1.9 1-3.1 1-2.4 0-4.4-1.6-5.1-3.8l-3 2.3C5.3 19.2 8.4 21.2 12 21.2z"
      />
      <path
        fill="#FBBC05"
        d="M6.9 14c-.2-.6-.3-1.2-.3-1.9s.1-1.3.3-1.9l-3-2.3C3.3 9.3 2.8 10.6 2.8 12s.5 2.7 1.4 3.9l2.7-1.9z"
      />
    </svg>
  )
}
