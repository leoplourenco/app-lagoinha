import { Link } from 'react-router-dom'

export function InstalarPage() {
  return (
    <div className="min-h-dvh bg-[radial-gradient(ellipse_at_top,_#0ea5e9_0%,_#0c4a6e_45%,_#082f49_100%)] px-4 py-8 text-white">
      <div className="mx-auto max-w-lg space-y-5">
        <p className="text-xs uppercase tracking-[0.2em] text-sky-100/70">App Lagoinha</p>
        <h1 className="font-display text-3xl">Como instalar</h1>
        <p className="text-sky-100/80">
          É um PWA: você pode colocar um atalho na tela inicial. Não é obrigatório para usar no culto.
        </p>

        <section className="rounded-2xl border border-white/15 bg-white/10 p-4">
          <h2 className="font-semibold">iPhone / Safari</h2>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-sky-50/90">
            <li>Abra o site no Safari</li>
            <li>Toque em Compartilhar</li>
            <li>Escolha “Adicionar à Tela de Início”</li>
          </ol>
        </section>

        <section className="rounded-2xl border border-white/15 bg-white/10 p-4">
          <h2 className="font-semibold">Android / Chrome</h2>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-sky-50/90">
            <li>Abra o site no Chrome</li>
            <li>Menu ⋮ → “Instalar app” ou “Adicionar à tela inicial”</li>
          </ol>
        </section>

        <Link
          to="/"
          className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-white/20 text-sm font-semibold hover:bg-white/10"
        >
          Voltar ao app
        </Link>
        <Link to="/config" className="block text-center text-sm underline">
          Ir para Config
        </Link>
      </div>
    </div>
  )
}
