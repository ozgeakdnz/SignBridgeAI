import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/layout'
import { GuvenlikPage } from './pages/GuvenlikPage'
import { KopruPage } from './pages/KopruPage'
import { ProfilPage } from './pages/ProfilPage'
import { ToplulukPage } from './pages/ToplulukPage'
import { YakinlarimPage } from './pages/YakinlarimPage'
import { LandingPage } from './pages/landing/LandingPage'
import { AuthPage } from './pages/auth/AuthPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/giris" element={<AuthPage />} />
      <Route path="/kaydol" element={<Navigate to="/giris" replace />} />

      <Route element={<AppShell />}>
        <Route path="kopru" element={<KopruPage />} />
        <Route path="guvenlik" element={<GuvenlikPage />} />
        <Route path="yakinlarim" element={<YakinlarimPage />} />
        <Route path="topluluk" element={<ToplulukPage />} />
        <Route path="profil" element={<ProfilPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
