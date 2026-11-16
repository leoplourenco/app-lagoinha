import { Link } from 'react-router-dom'

const links = [
  { to: '/host/agenda', label: 'Agenda de convidados', hint: 'Status previsto / chegou / concluído' },
  { to: '/host/cardapio', label: 'Cardápio do visitante', hint: 'Itens base + por visita' },
  { to: '/host/louca', label: 'Inventário de louça', hint: 'Separado da cozinha da Sala' },
]

export function HostHubPage() {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-brand text-2xl">Host</h2>
        <p className="mt-1 text-sm text-muted">
          Convidados especiais, cardápio e louça.
        </p>
      </div>
      <div className="space-y-3">
        {links.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className="block rounded-2xl border border-white/15 bg-white/10 px-4 py-4 hover:bg-white/15"
          >
            <p className="font-semibold">{link.label}</p>
            <p className="text-sm text-muted">{link.hint}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
