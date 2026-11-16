import { Link, useSearchParams } from 'react-router-dom'
import { BrandMark } from '../components/brand/BrandMark'
import { GoldWaves } from '../components/brand/GoldWaves'

export function AuthErrorPage() {
  const [params] = useSearchParams()
  const description =
    params.get('error_description') ||
    params.get('error') ||
    'Falha no login com Google'

  const decoded = decodeURIComponent(description.replace(/\+/g, ' '))
  const hint = decoded.toLowerCase().includes('exchange')
    ? 'No Supabase → Authentication → Providers → Google: cole de novo o Client Secret do mesmo cliente OAuth do Google Cloud e salve.'
    : 'Confira Client ID/Secret no Supabase e a callback URL no Google Cloud.'

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-ink px-5 py-10 text-white">
      <GoldWaves />
      <div className="relative w-full max-w-md space-y-5 text-center">
        <BrandMark size="sm" />
        <h1 className="text-2xl font-semibold">Não deu pra entrar com Google</h1>
        <p className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {decoded}
        </p>
        <p className="text-sm text-muted">{hint}</p>
        <Link
          to="/login"
          className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-gold text-sm font-semibold text-black hover:bg-gold-soft"
        >
          Voltar ao login
        </Link>
      </div>
    </div>
  )
}
