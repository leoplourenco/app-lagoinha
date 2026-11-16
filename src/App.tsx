import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AppShell } from './components/layout/AppShell'
import { LoginPage } from './pages/LoginPage'
import { CadastroPage } from './pages/CadastroPage'
import { HomePage } from './pages/HomePage'
import { CheckinPage } from './pages/CheckinPage'
import { CheckinManualPage } from './pages/CheckinManualPage'
import { EscalaPage } from './pages/EscalaPage'
import { EquipePage } from './pages/EquipePage'
import { AdminPage } from './pages/AdminPage'
import { ConfigPage } from './pages/ConfigPage'
import { InstalarPage } from './pages/InstalarPage'
import { RelatoriosPage } from './pages/RelatoriosPage'
import { SalaHubPage } from './pages/sala/SalaHubPage'
import { SalaPresencaPage } from './pages/sala/SalaPresencaPage'
import { SalaEstoquePage } from './pages/sala/SalaEstoquePage'
import { SalaCafePage } from './pages/sala/SalaCafePage'
import { HostHubPage } from './pages/host/HostHubPage'
import { HostAgendaPage } from './pages/host/HostAgendaPage'
import { HostCardapioPage } from './pages/host/HostCardapioPage'
import { HostLoucaPage } from './pages/host/HostLoucaPage'
import { hasSupabaseConfig } from './lib/supabase'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        {!hasSupabaseConfig ? (
          <div className="flex min-h-dvh items-center justify-center bg-ink px-6 text-center text-white">
            <div className="max-w-md space-y-3">
              <h1 className="font-brand text-3xl text-gold">App Lagoinha</h1>
              <p className="text-muted">
                Configure <code className="text-gold-soft">VITE_SUPABASE_URL</code> e{' '}
                <code className="text-gold-soft">VITE_SUPABASE_ANON_KEY</code> no arquivo{' '}
                <code className="text-gold-soft">.env</code> (veja .env.example) e rode o SQL em{' '}
                <code className="text-gold-soft">supabase/schema.sql</code>.
              </p>
            </div>
          </div>
        ) : (
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/cadastro" element={<CadastroPage />} />
            <Route path="/instalar" element={<InstalarPage />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<AppShell />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/checkin" element={<CheckinPage />} />
                <Route path="/escala" element={<EscalaPage />} />
                <Route path="/config" element={<ConfigPage />} />
              </Route>
            </Route>

            <Route element={<ProtectedRoute requireLeader />}>
              <Route element={<AppShell />}>
                <Route path="/checkin/manual" element={<CheckinManualPage />} />
                <Route path="/equipe" element={<EquipePage />} />
                <Route path="/relatorios" element={<RelatoriosPage />} />
              </Route>
            </Route>

            <Route element={<ProtectedRoute requireAdmin />}>
              <Route element={<AppShell />}>
                <Route path="/admin" element={<AdminPage />} />
              </Route>
            </Route>

            <Route element={<ProtectedRoute requireSala />}>
              <Route element={<AppShell />}>
                <Route path="/sala" element={<SalaHubPage />} />
                <Route path="/sala/presenca" element={<SalaPresencaPage />} />
                <Route path="/sala/estoque" element={<SalaEstoquePage />} />
                <Route path="/sala/cafe" element={<SalaCafePage />} />
              </Route>
            </Route>

            <Route element={<ProtectedRoute requireHost />}>
              <Route element={<AppShell />}>
                <Route path="/host" element={<HostHubPage />} />
                <Route path="/host/agenda" element={<HostAgendaPage />} />
                <Route path="/host/cardapio" element={<HostCardapioPage />} />
                <Route path="/host/louca" element={<HostLoucaPage />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        )}
      </BrowserRouter>
    </AuthProvider>
  )
}
