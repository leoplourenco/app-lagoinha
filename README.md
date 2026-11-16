# App Lagoinha

PWA para voluntários da **Igreja Batista da Lagoinha** — núcleo (auth, escala, check-in por culto) + **Sala de Voluntários** + **Host**.

Stack: Vite · React · TypeScript · Tailwind · shadcn-style UI · Supabase · Vercel PWA.

## Setup rápido

1. Crie um projeto no [Supabase](https://supabase.com).
2. No SQL Editor, rode `supabase/schema.sql` (schema + RLS + seed).
3. Copie `.env.example` → `.env` e preencha:

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

4. Auth do Supabase: habilite e-mail/senha. Em Authentication → URL configuration, adicione a URL do Vercel.
5. Instale e rode:

```bash
npm install
npm run dev
```

## Seed / papéis

- Admin seed automático no trigger: `leopoldo.lourenco@outlook.com`
- Ministérios: `sala`, `host`
- QR estável: `lagoinha-checkin-v1` (imprimível em `/admin`)
- Cultos exemplo: domingo manhã e noite (America/Sao_Paulo)

Fluxo admin: pastores se cadastram → Leo promove em `/admin`.

## Check-in

- Sempre **por culto** (`unique(user_id, event_id)`), não 1x/dia.
- Manhã + noite no mesmo dia = dois check-ins possíveis.
- QR pela câmera + check-in manual (líder/admin).
- Porta da Sala: busca por nome e baixa (voluntário pode estar offline).

## Rotas

| Rota | Função |
| --- | --- |
| `/login` `/cadastro` | Auth + LGPD leve |
| `/` | Home |
| `/checkin` `/checkin/manual` | Check-in QR / manual |
| `/escala` `/equipe` `/relatorios` | Escala com rótulo, equipe, relatórios |
| `/admin` | Usuários, cultos, QR imprimível |
| `/sala/*` | Presença, estoque, café |
| `/host/*` | Agenda, cardápio, louça |
| `/config` `/instalar` | Orientações PWA (não força no 1º login) |

## Login com Google

1. No Supabase: **Authentication → Providers → Google** → Enable.
2. Crie OAuth no [Google Cloud Console](https://console.cloud.google.com/apis/credentials) (tipo Web).
3. Authorized redirect URI do Google: a URL que o Supabase mostra no provider (ex. `https://rymthbyhtybqxxblvknp.supabase.co/auth/v1/callback`).
4. Cole Client ID + Client Secret no Supabase.
5. Em **Authentication → URL configuration**, inclua:
   - `http://localhost:5173/**`
   - `https://app-lagoinha.vercel.app/**`
6. Rode no SQL Editor: `supabase/schema_google_auth.sql` (nome do perfil via Google).

## Deploy (Vercel Hobby)

1. Repo: `leoplourenco/app-lagoinha`
2. Framework: Vite
3. Env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
4. Commits com autor `leoplourenco <leoplourenco@users.noreply.github.com>`

## Spec / Notion

Fonte da verdade: pasta **App Lagoinha** no Notion (Hub + Spec V1 + Handoff Agentes).
