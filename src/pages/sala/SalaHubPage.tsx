import { Link } from 'react-router-dom'

const links = [
  { to: '/sala/presenca', label: 'Presença na porta', hint: 'Buscar pelo nome e dar baixa' },
  { to: '/sala/estoque', label: 'Estoque da cozinha', hint: 'Quantidades e alerta de mínimo' },
  { to: '/sala/cafe', label: 'To-do dos cafés', hint: 'Checklist por culto' },
]

export function SalaHubPage() {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-brand text-2xl">Sala de Voluntários</h2>
        <p className="mt-1 text-sm text-muted">
          Porta, cozinha e café — operação do culto.
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
