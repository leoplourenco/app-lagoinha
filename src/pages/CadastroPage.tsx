import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
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
    <AuthScreen title="Cadastro" subtitle="Crie sua conta de voluntário">
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">Nome completo</Label>
          <Input
            id="name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
            type="password"
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <label className="flex items-start gap-3 rounded-xl border border-white/15 bg-white/5 p-3 text-sm text-sky-50/90">
          <input
            type="checkbox"
            className="mt-1"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
          />
          <span>
            <strong className="block text-white">Privacidade (LGPD leve)</strong>
            {PRIVACY}
          </span>
        </label>
        {error ? <p className="text-sm text-rose-200">{error}</p> : null}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Criando…' : 'Criar conta'}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-sky-100/80">
        Já tem conta?{' '}
        <Link className="font-semibold text-white underline" to="/login">
          Entrar
        </Link>
      </p>
    </AuthScreen>
  )
}
