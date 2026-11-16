import { Link } from 'react-router-dom'
import { BrandMark } from '../components/brand/BrandMark'
import { GoldWaves } from '../components/brand/GoldWaves'

export function InstalarPage() {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-ink px-4 py-8 text-white">
      <GoldWaves />
      <div className="relative mx-auto max-w-lg space-y-5">
        <BrandMark size="sm" />
        <h1 className="text-center text-2xl font-semibold">Como instalar</h1>
        <p className="text-center text-sm text-muted">
          PWA opcional — atalho na tela inicial. Não é obrigatório para usar no culto.
        </p>

        <section className="rounded-2xl border border-white/10 bg-panel p-4">
          <h2 className="font-semibold text-gold">iPhone / Safari</h2>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-muted">
            <li>Abra o site no Safari</li>
            <li>Toque em Compartilhar</li>
            <li>Escolha “Adicionar à Tela de Início”</li>
          </ol>
        </section>

        <section className="rounded-2xl border border-white/10 bg-panel p-4">
          <h2 className="font-semibold text-gold">Android / Chrome</h2>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-muted">
            <li>Abra o site no Chrome</li>
            <li>Menu ⋮ → “Instalar app” ou “Adicionar à tela inicial”</li>
          </ol>
        </section>

        <Link
          to="/"
          className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-gold text-sm font-semibold text-black hover:bg-gold-soft"
        >
          Voltar ao app
        </Link>
        <Link to="/config" className="block text-center text-sm text-gold underline">
          Ir para Config
        </Link>
      </div>
    </div>
  )
}
