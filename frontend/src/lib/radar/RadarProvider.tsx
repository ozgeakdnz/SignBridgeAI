import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { radarEngine } from './engine'
import type { RadarSettings, RadarState } from './types'
import type { VibrationLevel } from './soundClasses'
import { formatClock } from './alerts'
import { Icon } from '../../components/Icon'

type RadarContextValue = RadarState & {
  start: () => Promise<void>
  stop: () => void
  toggle: () => Promise<void>
  setMode: (mode: RadarState['mode']) => void
  setToggle: (key: keyof RadarSettings, value: boolean) => void
  setVibration: (value: VibrationLevel) => void
  snoozeLatest: () => void
  dismissOverlay: () => void
  triggerStrobeTest: () => void
}

const RadarContext = createContext<RadarContextValue | null>(null)

export function RadarProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<RadarState>(() => radarEngine.getState())

  useEffect(() => radarEngine.subscribe(setState), [])

  const value = useMemo<RadarContextValue>(
    () => ({
      ...state,
      start: () => radarEngine.start(),
      stop: () => radarEngine.stop(),
      toggle: () => radarEngine.toggle(),
      setMode: (mode) => radarEngine.setMode(mode),
      setToggle: (key, value) => {
        if (key === 'vibration') return
        radarEngine.setSettings({ [key]: value })
      },
      setVibration: (vibration) => radarEngine.setSettings({ vibration }),
      snoozeLatest: () => radarEngine.snoozeLatest(),
      dismissOverlay: () => radarEngine.dismissOverlay(),
      triggerStrobeTest: () => radarEngine.triggerStrobeTest(),
    }),
    [state],
  )

  return (
    <RadarContext.Provider value={value}>
      {children}
      <RadarAlertHost overlay={state.overlay} strobeOn={state.strobeOn} onDismiss={value.dismissOverlay} />
    </RadarContext.Provider>
  )
}

export function useRadar() {
  const ctx = useContext(RadarContext)
  if (!ctx) throw new Error('useRadar RadarProvider içinde kullanılmalı')
  return ctx
}

function RadarAlertHost({
  overlay,
  strobeOn,
  onDismiss,
}: {
  overlay: RadarState['overlay']
  strobeOn: boolean
  onDismiss: () => void
}) {
  return (
    <>
      <div
        className={`pointer-events-none fixed inset-0 z-[80] bg-white transition-opacity duration-100 ${
          strobeOn ? 'opacity-90' : 'opacity-0'
        }`}
        aria-hidden
      />
      {overlay && (
        <div className="fixed inset-x-3 top-20 z-[90] mx-auto max-w-lg">
          <div
            role="alert"
            className="flex items-start gap-3 rounded-2xl bg-on-surface px-4 py-4 text-surface-container-lowest shadow-2xl"
          >
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-secondary-container text-on-secondary-container">
              <Icon name={overlay.icon} filled className="text-[32px]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold tracking-widest uppercase opacity-80">
                Akustik Radar
              </p>
              <p className="text-2xl leading-tight font-bold">{overlay.label}</p>
              <p className="mt-1 text-sm opacity-80">
                {formatClock(overlay.at)} • %{Math.round(overlay.score * 100)} • {overlay.matchedClass}
              </p>
            </div>
            <button
              type="button"
              onClick={onDismiss}
              className="rounded-md px-2 py-1 text-[12px] font-bold uppercase opacity-80 hover:opacity-100"
            >
              Kapat
            </button>
          </div>
        </div>
      )}
    </>
  )
}
