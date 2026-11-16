import { useState, type FormEvent } from 'react'
import { Lock, User } from 'lucide-react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { BrandMark } from '../components/brand/BrandMark'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { useAuth } from '../context/AuthContext'
import { hasSupabaseConfig, supabase } from '../lib/supabase'
import { AuthScreen } from './LoginPage'

const PRIVACY =
  'Usamos seu nome e e-mail só para organizar escalas, check-in e operação dos ministérios da igreja. Você pode pedir exclusão depois ao admin.'

export function CadastroPage() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [accepted, setAccepted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (session) return <Navigate to="/" replace />

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!accepted) {
      setError('Aceite o aviso de privacidade para continuar.')
      return
    }
    if (!hasSupabaseConfig) {
      setError('Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env')
      return
    }
    setLoading(true)
    const { error: err } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          privacy_accepted: 'true',
        },
      },
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
        <h1 className="text-2xl font-semibold tracking-tight text-white">Criar conta</h1>
        <p className="mt-2 text-sm text-muted">Cadastro de voluntário da Lagoinha.</p>
      </div>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <div className="relative">
          <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gold" />
          <Input
            id="name"
            placeholder="Nome completo"
            className="pl-11"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </div>
        <Input
          id="email"
          type="email"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <div className="relative">
          <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gold" />
          <Input
            id="password"
            type="password"
            minLength={6}
            placeholder="Senha"
            className="pl-11"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-panel-2 p-3 text-sm text-muted">
          <input
            type="checkbox"
            className="mt-1 accent-gold"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
          />
          <span>
            <strong className="block text-white">Privacidade (LGPD leve)</strong>
            {PRIVACY}
          </span>
        </label>
        {error ? <p className="text-sm text-rose-300">{error}</p> : null}
        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? 'Criando…' : 'Criar conta'}
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-gold">
        <Link to="/login" className="hover:text-gold-soft">
          Já tem conta? Entrar
        </Link>
      </p>
    </AuthScreen>
  )
}
