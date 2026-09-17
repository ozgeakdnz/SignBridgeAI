import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/layout'
import { GuvenlikPage } from './pages/GuvenlikPage'
import { KopruPage } from './pages/KopruPage'
import { ProfilPage } from './pages/ProfilPage'
import { ToplulukPage } from './pages/ToplulukPage'
import { YakinlarimPage } from './pages/YakinlarimPage'

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Navigate to="/kopru" replace />} />
        <Route path="kopru" element={<KopruPage />} />
        <Route path="guvenlik" element={<GuvenlikPage />} />
        <Route path="yakinlarim" element={<YakinlarimPage />} />
        <Route path="topluluk" element={<ToplulukPage />} />
        <Route path="profil" element={<ProfilPage />} />
      </Route>
    </Routes>
  )
}
