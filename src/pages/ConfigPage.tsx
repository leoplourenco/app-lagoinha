import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

export function ConfigPage() {
  const { profile, user, signOut, memberships, isAdmin, isLeader } = useAuth()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function changePassword(e: FormEvent) {
    e.preventDefault()
    setMessage(null)
    setError(null)

    if (!user?.email) {
      setError('Sessão inválida. Faça login de novo.')
      return
    }
    if (newPassword.length < 6) {
      setError('A nova senha precisa ter pelo menos 6 caracteres.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('A confirmação não bate com a nova senha.')
      return
    }
    if (newPassword === currentPassword) {
      setError('A nova senha precisa ser diferente da atual.')
      return
    }

    setLoading(true)
    const { error: authErr } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    })
    if (authErr) {
      setLoading(false)
      setError('Senha atual incorreta.')
      return
    }

    const { error: updateErr } = await supabase.auth.updateUser({
      password: newPassword,
    })
    setLoading(false)

    if (updateErr) {
      setError(updateErr.message)
      return
    }

    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setMessage('Senha alterada com sucesso.')
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-brand text-2xl text-gold">Config</h2>
        <p className="mt-1 text-sm text-muted">Conta, senha e orientações.</p>
      </div>

      <section className="rounded-2xl border border-white/10 bg-panel p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-gold">
          {isAdmin ? 'Admin' : isLeader ? 'Líder' : 'Voluntário'}
        </p>
        <p className="mt-1 font-semibold">{profile?.full_name}</p>
        <p className="text-sm text-muted">{profile?.email}</p>
        <p className="mt-2 text-xs text-muted">
          {memberships.length
            ? memberships
                .map((m) => `${m.ministry?.name ?? 'Ministério'} (${m.role === 'leader' ? 'líder' : 'voluntário'})`)
                .join(' · ')
            : 'Ainda sem ministério — peça ao líder para te adicionar.'}
        </p>
        {isLeader ? (
          <p className="mt-3 text-sm text-gold-soft">
            Como líder você monta escala, gerencia equipe e vê relatórios.
          </p>
        ) : (
          <p className="mt-3 text-sm text-muted">
            Como voluntário você faz check-in e consulta sua escala.
          </p>
        )}
      </section>

      <form
        onSubmit={changePassword}
        className="space-y-3 rounded-2xl border border-white/10 bg-panel p-4"
      >
        <div>
          <p className="font-semibold">Trocar senha</p>
          <p className="mt-1 text-sm text-muted">
            Informe a senha atual e escolha uma nova.
          </p>
        </div>
        <div>
          <Label htmlFor="current-password">Senha atual</Label>
          <Input
            id="current-password"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="new-password">Nova senha</Label>
          <Input
            id="new-password"
            type="password"
            autoComplete="new-password"
            minLength={6}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="confirm-password">Confirmar nova senha</Label>
          <Input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            minLength={6}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>
        {message ? <p className="text-sm text-emerald-300">{message}</p> : null}
        {error ? <p className="text-sm text-rose-300">{error}</p> : null}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Salvando…' : 'Salvar nova senha'}
        </Button>
      </form>

      <section className="rounded-2xl border border-white/10 bg-panel p-4">
        <p className="font-semibold">Como instalar o app</p>
        <p className="mt-1 text-sm text-muted">
          Opcional — não é obrigatório no primeiro login. Use o atalho na tela inicial se quiser.
        </p>
        <Link to="/instalar" className="mt-3 inline-block text-sm font-semibold text-gold underline">
          Abrir passo a passo → /instalar
        </Link>
      </section>

      <Button variant="outline" className="w-full" onClick={() => void signOut()}>
        Sair
      </Button>
    </div>
  )
}
