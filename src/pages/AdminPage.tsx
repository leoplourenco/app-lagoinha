import { Link } from 'react-router-dom'
import { Building2, ClipboardList, QrCode, Users } from 'lucide-react'

const cards = [
  {
    to: '/admin/ministerios',
    title: 'Ministérios',
    hint: 'Ver todos os ministérios e líderes',
    icon: Building2,
  },
  {
    to: '/admin/relatorios',
    title: 'Relatórios',
    hint: 'Presença e check-in por culto',
    icon: ClipboardList,
  },
  {
    to: '/admin/usuarios',
    title: 'Usuários',
    hint: 'Promover ou remover líderes',
    icon: Users,
  },
]

export function AdminPage() {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-gold">Painel admin</p>
        <h2 className="mt-1 font-brand text-2xl text-gold">Administração</h2>
        <p className="mt-1 text-sm text-muted">
          Você está acima dos líderes de ministério. Gerencie a igreja por aqui.
        </p>
      </div>

      <div className="space-y-3">
        {cards.map((card) => (
          <Link
            key={card.to}
            to={card.to}
            className="flex items-center gap-4 rounded-2xl border border-white/10 bg-panel px-4 py-5 hover:border-gold/40"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold/15 text-gold">
              <card.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-lg font-semibold text-white">{card.title}</p>
              <p className="text-sm text-muted">{card.hint}</p>
            </div>
          </Link>
        ))}
      </div>

      <Link
        to="/admin/ferramentas"
        className="flex items-center gap-3 rounded-2xl border border-dashed border-white/15 px-4 py-4 text-sm text-muted hover:border-gold/40 hover:text-gold"
      >
        <QrCode className="h-5 w-5" />
        QR imprimível e cultos
      </Link>
    </div>
  )
}
