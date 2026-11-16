import { useState, type FormEvent, type ReactNode } from 'react'
import { Eye, EyeOff, Lock, User } from 'lucide-react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { BrandMark } from '../components/brand/BrandMark'
import { GoldWaves } from '../components/brand/GoldWaves'
import { GoogleSignInButton } from '../components/GoogleSignInButton'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { useAuth } from '../context/AuthContext'
import { hasSupabaseConfig, supabase } from '../lib/supabase'
import { cn } from '../lib/utils'

export function LoginPage() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (session) return <Navigate to="/" replace />

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!hasSupabaseConfig) {
      setError('Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env')
      return
    }
    setLoading(true)
    const { error: err } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })
    setLoading(false)
    if (err) {
      setError(err.message)
      return
    }
    navigate('/')
  }

  return (
    <AuthScreen>
      <BrandMark size="md" />
      <div className="mt-6 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-white">Acesse sua conta</h1>
        <p className="mt-2 text-sm text-muted">Entre com suas credenciais para continuar.</p>
      </div>

      <div className="mt-8 space-y-4">
        <GoogleSignInButton />

        <div className="flex items-center gap-3 text-xs text-muted">
          <div className="h-px flex-1 bg-white/15" />
          ou com e-mail
          <div className="h-px flex-1 bg-white/15" />
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="relative">
            <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gold" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="Usuário / e-mail"
              className="pl-11"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gold" />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Senha"
              className="px-11"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-muted hover:text-gold"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {error ? <p className="text-sm text-rose-300">{error}</p> : null}
          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? 'Entrando…' : 'Entrar'}
          </Button>
        </form>
      </div>

      <p className="mt-5 text-center text-sm text-gold">
        <Link to="/cadastro" className="hover:text-gold-soft">
          Ainda não tem conta? Cadastre-se
        </Link>
      </p>
    </AuthScreen>
  )
}

export function AuthScreen({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-ink px-5 py-10 text-white">
      <GoldWaves />
      <div className={cn('relative w-full max-w-md', className)}>{children}</div>
    </div>
  )
}
