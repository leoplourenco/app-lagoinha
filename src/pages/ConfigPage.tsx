import { Link } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { useAuth } from '../context/AuthContext'

export function ConfigPage() {
  const { profile, signOut, memberships, isAdmin } = useAuth()

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-2xl">Config</h2>
        <p className="mt-1 text-sm text-sky-100/80">Conta e orientações.</p>
      </div>

      <section className="rounded-2xl border border-white/15 bg-white/10 p-4">
        <p className="font-semibold">{profile?.full_name}</p>
        <p className="text-sm text-sky-100/70">{profile?.email}</p>
        <p className="mt-2 text-xs text-sky-100/60">
          {isAdmin ? 'Admin' : 'Voluntário'}
          {memberships.length
            ? ` · ${memberships.map((m) => m.ministry?.name).filter(Boolean).join(', ')}`
            : ' · ainda sem ministério'}
        </p>
      </section>

      <section className="rounded-2xl border border-white/15 bg-white/10 p-4">
        <p className="font-semibold">Como instalar o app</p>
        <p className="mt-1 text-sm text-sky-100/70">
          Opcional — não é obrigatório no primeiro login. Use o atalho na tela inicial se quiser.
        </p>
        <Link to="/instalar" className="mt-3 inline-block text-sm font-semibold underline">
          Abrir passo a passo → /instalar
        </Link>
      </section>

      <Button variant="outline" className="w-full" onClick={() => void signOut()}>
        Sair
      </Button>
    </div>
  )
}
