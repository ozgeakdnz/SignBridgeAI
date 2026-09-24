import { Link, NavLink, Outlet } from 'react-router-dom'
import { Icon } from './Icon'
import { useRadar } from '../lib/radar/RadarProvider'

const tabs = [
  { to: '/kopru', label: 'Köprü', icon: 'translate' },
  { to: '/guvenlik', label: 'Güvenlik', icon: 'radar' },
  { to: '/yakinlarim', label: 'Yakınlarım', icon: 'group' },
  { to: '/topluluk', label: 'Topluluk', icon: 'forum' },
] as const

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 z-50 w-full bg-surface-container-lowest/95 pb-safe shadow-[0_-2px_12px_rgba(0,35,111,0.05)] backdrop-blur-xl">
      <div className="flex h-16 items-center justify-around px-space-sm">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              `flex h-12 min-w-14 flex-col items-center justify-center gap-0.5 transition-all active:scale-95 ${
                isActive
                  ? 'font-bold text-primary'
                  : 'text-on-surface-variant hover:text-primary'
              }`
            }
          >
            <Icon name={tab.icon} className="text-[24px]" />
            <span className="text-[11px] font-bold tracking-wide">{tab.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

type AppHeaderProps = {
  subtitle: string
}

export function AppHeader({ subtitle }: AppHeaderProps) {
  return (
    <header className="fixed top-0 z-50 w-full bg-surface-container-lowest/90 pt-safe shadow-[0_1px_8px_rgba(0,0,0,0.04)] backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-margin">
        <Link
          to="/"
          aria-label="SignBridge AI ana sayfa"
          className="flex min-w-0 items-center gap-space-sm transition-opacity hover:opacity-80 active:scale-[0.98]"
        >
          <BrandMark />
          <div className="flex min-w-0 flex-col">
            <span className="text-lg font-semibold leading-none tracking-tight text-primary">
              SignBridge
            </span>
            <span className="mt-0.5 truncate text-[11px] font-medium leading-none tracking-wide text-on-surface-variant">
              {subtitle}
            </span>
          </div>
        </Link>
        <div className="flex items-center gap-space-sm">
          <ListeningBadge />
          <Link
            to="/profil"
            className="relative flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full bg-primary shadow-[0_2px_6px_rgba(0,35,111,0.15)] transition-transform hover:scale-105 active:scale-95"
            aria-label="Profil"
          >
            <Icon name="person" className="text-[18px] text-on-primary" />
          </Link>
        </div>
      </div>
    </header>
  )
}

function BrandMark() {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-[linear-gradient(145deg,#4A7DE8,#1E4BB8)] shadow-[0_6px_14px_rgba(42,86,200,0.3)]">
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#fff"
        strokeWidth="1.9"
        strokeLinecap="round"
        aria-hidden="true"
      >
        <path d="M3 12c1.6-3.4 3.2-3.4 4.8 0s3.2 3.4 4.8 0 3.2-3.4 4.8 0" />
        <path d="M20 7v10" />
      </svg>
    </span>
  )
}

export function AppShell() {
  return (
    <div className="flex min-h-dvh flex-col bg-surface antialiased">
      <Outlet />
      <BottomNav />
    </div>
  )
}

function ListeningBadge() {
  const { status, toggle } = useRadar()
  const listening = status === 'listening' || status === 'starting'
  const label =
    status === 'listening'
      ? 'Aktif Dinleme'
      : status === 'starting'
        ? 'Başlıyor'
        : status === 'denied'
          ? 'Mikrofon kapalı'
          : 'Dinleme kapalı'

  return (
    <button
      type="button"
      onClick={() => void toggle()}
      title={listening ? 'Akustik Radar’ı durdur' : 'Akustik Radar’ı başlat'}
      className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 shadow-[0_1px_4px_rgba(0,0,0,0.02)] transition-colors ${
        listening
          ? 'bg-surface-container-low text-tertiary-container'
          : 'bg-surface-container text-on-surface-variant'
      }`}
    >
      <span
        className={`h-2 w-2 rounded-full ${
          listening ? 'animate-pulse bg-tertiary-fixed-dim' : 'bg-outline-variant'
        }`}
      />
      <span className="text-[11px] font-bold tracking-wide">{label}</span>
    </button>
  )
}
