import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AppHeader } from '../components/layout'
import { Icon } from '../components/Icon'
import { formatClock } from '../lib/radar/alerts'
import { useRadar } from '../lib/radar/RadarProvider'
import { SOUND_CLASSES, type SoundType } from '../lib/radar/soundClasses'
import { bestScoreForType } from '../lib/radar/evaluate'

const contacts = [
  { initial: 'A', name: 'Anne', tone: 'bg-primary-fixed text-on-primary-fixed' },
  { initial: 'K', name: 'Kardeş', tone: 'bg-surface-container-high text-primary' },
  { initial: 'A', name: 'Ahmet (Komşu)', tone: 'bg-surface-container-high text-primary' },
] as const

export function GuvenlikPage() {
  const [searchParams] = useSearchParams()
  const debugYamnet = searchParams.get('debug') === 'yamnet'
  const radar = useRadar()
  const listening = radar.status === 'listening'
  const starting = radar.status === 'starting'
  const [silencedId, setSilencedId] = useState<string | null>(null)
  const [camActive, setCamActive] = useState(false)
  const [camNote, setCamNote] = useState(false)
  const [sosState, setSosState] = useState<'idle' | 'counting' | 'sent'>('idle')
  const [sosSeconds, setSosSeconds] = useState(3)
  const [progressOn, setProgressOn] = useState(false)
  const sosTimerRef = useRef<number | null>(null)
  const latest = radar.latest
  const silenced = Boolean(latest && silencedId === latest.id)
  const pinging = Boolean(latest && silencedId !== latest.id)
  const topHeard = radar.topClasses[0]
  const liveScores = (['doorbell', 'horn', 'siren', 'baby'] as SoundType[]).map((id) => ({
    id,
    label: SOUND_CLASSES[id].label,
    score: bestScoreForType(radar.topClasses, id)?.score ?? 0,
  }))

  const cancelSos = () => {
    if (sosTimerRef.current) {
      window.clearInterval(sosTimerRef.current)
      sosTimerRef.current = null
    }
    setProgressOn(false)
    setSosState('idle')
    setSosSeconds(3)
  }

  const startSos = () => {
    if (sosState !== 'idle') return
    setSosState('counting')
    setSosSeconds(3)
    setProgressOn(false)
    requestAnimationFrame(() => setProgressOn(true))

    sosTimerRef.current = window.setInterval(() => {
      setSosSeconds((prev) => {
        if (prev <= 1) {
          if (sosTimerRef.current) {
            window.clearInterval(sosTimerRef.current)
            sosTimerRef.current = null
          }
          setSosState('sent')
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  useEffect(() => () => cancelSos(), [])

  return (
    <>
      <AppHeader subtitle="Güvenlik Radarı" />
      <main className="relative flex min-h-dvh w-full flex-col bg-surface pb-24 pt-16">
        <div className="flex w-full flex-col gap-space-lg px-margin py-space-md">
          <section className="relative flex flex-col items-center justify-center overflow-hidden rounded-lg bg-surface-container-lowest p-space-md shadow-sm">
            <div className="z-10 mb-space-md flex w-full items-center justify-between">
              <div className="flex items-center gap-1.5 rounded-full bg-surface-container px-3 py-1 text-primary">
                <Icon name="hearing" className="text-[16px]" />
                <span className="text-[11px] font-bold uppercase tracking-wider">
                  360° Çevresel Algı
                </span>
              </div>
              <div className="relative inline-flex rounded-full bg-surface-container-low p-1">
                <button
                  type="button"
                  onClick={() => {
                    radar.setMode('home')
                  }}
                  className={`relative z-10 rounded-full px-3 py-1 text-[11px] font-bold transition-all duration-300 active:scale-95 ${
                    radar.mode === 'home'
                      ? 'bg-primary text-on-primary shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  Ev &amp; Dinlenme
                </button>
                <button
                  type="button"
                  onClick={() => {
                    radar.setMode('outdoor')
                  }}
                  className={`relative z-10 rounded-full px-3 py-1 text-[11px] font-bold transition-all duration-300 active:scale-95 ${
                    radar.mode === 'outdoor'
                      ? 'bg-primary text-on-primary shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  Dış Mekan
                </button>
              </div>
            </div>

            <div
              className="relative my-2 flex h-56 w-56 cursor-pointer select-none items-center justify-center"
              onClick={() => void radar.toggle()}
              onKeyDown={(e) => e.key === 'Enter' && void radar.toggle()}
              role="button"
              tabIndex={0}
              title={listening ? 'Dinlemeyi durdur' : 'Akustik Radar’ı başlat'}
            >
              <div
                className={`ping-ring-1 pointer-events-none absolute inset-0 rounded-full border bg-secondary-fixed/20 ${
                  listening ? 'border-secondary/40' : 'border-outline-variant/30'
                }`}
              />
              <div
                className={`ping-ring-2 pointer-events-none absolute inset-2 rounded-full border bg-surface-container-high/30 ${
                  listening ? 'border-primary/30' : 'border-outline-variant/20'
                }`}
              />
              <div className="ping-ring-3 pointer-events-none absolute inset-6 rounded-full border border-secondary-container/40" />
              <div className="absolute inset-0 rounded-full border border-surface-container-highest bg-surface-container-low/40" />
              <div className="absolute inset-8 rounded-full border border-surface-variant bg-surface-container/30" />
              <div className="absolute inset-16 rounded-full border border-surface-variant/70" />
              <div
                className={`radar-sweep-cone pointer-events-none absolute inset-0 rounded-full ${
                  listening ? '' : 'opacity-30'
                }`}
              />
              <div
                key={latest?.id ?? 'idle'}
                className={`pointer-events-none absolute inset-0 rounded-full bg-primary/20 transition-all duration-700 ${
                  pinging ? 'scale-[1.9] opacity-0' : 'scale-0 opacity-0'
                }`}
              />

              <div className="pointer-events-none absolute top-2 text-[10px] font-bold tracking-widest text-on-surface-variant">
                KUZEY (ÖN)
              </div>
              <div className="pointer-events-none absolute bottom-2 text-[10px] font-bold tracking-widest text-outline">
                GÜNEY
              </div>
              <div className="pointer-events-none absolute left-2 text-[10px] font-bold tracking-widest text-outline">
                BATI
              </div>
              <div className="pointer-events-none absolute right-2 text-[10px] font-bold tracking-widest text-outline">
                DOĞU
              </div>

              <div
                className={`absolute z-20 flex cursor-pointer flex-col items-center transition-all duration-500 ${
                  radar.mode === 'home' ? 'top-8 right-12' : 'top-14 left-10'
                }`}
              >
                <span className="relative flex h-4 w-4 items-center justify-center">
                  <span className="beacon-glow absolute inline-flex h-full w-full rounded-full bg-secondary-container opacity-85" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-secondary ring-2 ring-white" />
                </span>
                <span
                  className={`mt-0.5 whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] font-extrabold shadow-sm transition-all ${
                    radar.mode === 'home'
                      ? 'bg-secondary-fixed text-secondary'
                      : 'bg-error-container text-error'
                  }`}
                >
                  {radar.mode === 'home' ? 'ÖN KAPI' : 'TRAFİK / KORNA'}
                </span>
              </div>

              <button
                type="button"
                className="relative z-10 flex h-20 w-20 flex-col items-center justify-center rounded-full bg-primary text-on-primary shadow-lg ring-4 ring-primary-container/20 transition-transform focus:outline-none active:scale-90"
                onClick={(e) => {
                  e.stopPropagation()
                  void radar.toggle()
                }}
              >
                <Icon
                  name={listening ? 'sensors' : starting ? 'progress_activity' : 'play_arrow'}
                  className={`text-[28px] ${listening || starting ? 'animate-pulse' : ''}`}
                />
                <span className="mt-0.5 text-[9px] font-bold tracking-wider uppercase">
                  {starting ? 'Yükleniyor' : listening ? 'Dinliyor' : 'Başlat'}
                </span>
              </button>
            </div>

            <div className="z-10 mt-space-sm flex items-center gap-2">
              <span
                className={`h-2 w-2 rounded-full ${
                  listening ? 'animate-ping bg-tertiary-fixed-dim' : 'bg-outline-variant'
                }`}
              />
              <span className="text-[13px] font-medium tracking-wide text-on-surface-variant">
                {listening ? (
                  radar.mode === 'home' ? (
                    <>
                      Akustik Radar:{' '}
                      <strong className="text-primary">Ev modu, dinliyor</strong>
                    </>
                  ) : (
                    <>
                      Akustik Radar:{' '}
                      <strong className="text-primary">Dış mekan, dinliyor</strong>
                    </>
                  )
                ) : starting ? (
                  <>YAMNet modeli yükleniyor…</>
                ) : (
                  <>
                    Akustik Radar kapalı — başlatmak için merkeze dokunun
                  </>
                )}
              </span>
            </div>
            {radar.errorMessage && (
              <p className="z-10 mt-2 max-w-sm text-center text-[12px] font-medium text-error">
                {radar.errorMessage}
              </p>
            )}
          </section>

          <section className="flex flex-col gap-space-sm">
            <div className="flex items-center justify-between px-space-xs">
              <h2 className="text-lg font-semibold text-on-surface">Canlı Algılamalar</h2>
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                  silenced || !latest
                    ? 'bg-surface-container text-outline'
                    : 'animate-pulse bg-surface-container-low text-tertiary-container'
                }`}
              >
                {!latest ? 'Olay yok' : silenced ? 'Yanıtlandı' : '1 Yeni Olay'}
              </span>
            </div>

            {(listening || starting) && (
              <div className="rounded-lg bg-surface-container-lowest p-space-md shadow-sm">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[12px] font-bold tracking-wider text-primary uppercase">
                    Canlı dinleme
                  </span>
                  <span className="text-[11px] text-on-surface-variant">
                    {radar.modelReady
                      ? topHeard
                        ? `Şu an: ${topHeard.name} (%${Math.round(topHeard.score * 100)})`
                        : 'Mikrofon açık — ses bekleniyor'
                      : 'Model yükleniyor…'}
                  </span>
                </div>
                <ul className="space-y-2">
                  {liveScores.map((row) => (
                    <li key={row.id} className="flex items-center gap-2">
                      <span className="w-28 shrink-0 truncate text-[12px] font-semibold text-on-surface">
                        {row.label}
                      </span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-container-high">
                        <div
                          className={`h-full rounded-full transition-all duration-200 ${
                            row.score >= SOUND_CLASSES[row.id].threshold
                              ? 'bg-tertiary-container'
                              : 'bg-primary'
                          }`}
                          style={{ width: `${Math.min(100, Math.round(row.score * 100))}%` }}
                        />
                      </div>
                      <span className="w-10 text-right text-[11px] font-bold text-on-surface-variant">
                        %{Math.round(row.score * 100)}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-[11px] text-outline">
                  Çubuklar hareket ediyorsa mikrofon çalışıyor. Yeşile yaklaşınca uyarı basılır.
                  Telefondan zil/korna çal; aynı hoparlörden çok kısık çalma.
                </p>
              </div>
            )}

            {radar.errorMessage && (
              <div className="rounded-lg bg-error-container/40 px-3 py-2 text-[13px] font-semibold text-on-surface">
                {radar.errorMessage}
              </div>
            )}

            <div className="relative flex flex-col overflow-hidden rounded-lg bg-surface-container-lowest p-space-md shadow-md transition-all duration-300">
              <div
                className={`absolute top-0 bottom-0 left-0 w-1.5 ${
                  latest && !silenced ? 'bg-secondary-container' : 'bg-surface-container'
                }`}
              />
              <div className="flex items-start justify-between pl-1">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-secondary-fixed text-on-secondary-fixed">
                    <Icon
                      name={latest?.icon ?? 'hearing'}
                      filled={Boolean(latest)}
                      className={`text-[28px] ${latest ? 'animate-bounce [animation-duration:2s]' : ''}`}
                    />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-semibold text-on-surface">
                        {latest ? `${latest.label} algılandı` : 'Kritik ses bekleniyor'}
                      </span>
                      {latest && (
                        <span className="rounded-full bg-secondary-fixed px-2 py-0.5 text-[11px] font-bold text-on-secondary-fixed">
                          ŞİMDİ
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-sm text-on-surface-variant">
                      {latest
                        ? `${formatClock(latest.at)} • ${latest.matchedClass}`
                        : listening
                          ? 'Mikrofon açık; ses cihazda sınıflandırılıyor'
                          : 'Dinlemeyi başlatınca gerçek olaylar burada görünür'}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[13px] font-bold text-secondary">
                    {latest ? `%${Math.round(latest.score * 100)}` : '—'}
                  </span>
                  <span className="text-[10px] text-outline">Güvenilirlik</span>
                </div>
              </div>

              <div className="mt-space-md flex items-center justify-between rounded-md bg-surface-container-low p-2.5 pt-3">
                <div className="flex items-center gap-2.5 text-on-surface">
                  <Icon name="vibration" className="text-[20px] text-primary" />
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[13px] font-semibold">Titreşim Deseni:</span>
                      <span className="text-sm text-on-surface-variant">
                        {latest
                          ? latest.vibrationLabel
                          : SOUND_CLASSES.doorbell.vibrationLabel}
                      </span>
                    </div>
                  </div>
                  <div className="flex h-5 items-center gap-1 rounded border border-outline-variant/30 bg-surface-container-lowest px-1">
                    <span className="wave-bar-1 w-1 rounded-full bg-primary" />
                    <span className="wave-bar-2 w-1 rounded-full bg-primary-container" />
                    <span className="wave-bar-3 w-1 rounded-full bg-secondary" />
                    <span className="wave-bar-4 w-1 rounded-full bg-primary" />
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-bold text-tertiary-container">
                  <Icon name="done_all" className="text-[16px]" />
                  <span>{latest ? 'İletildi' : 'Hazır'}</span>
                </div>
              </div>

              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  disabled={!latest}
                  onClick={() => {
                    if (!latest) return
                    setSilencedId(latest.id)
                    radar.snoozeLatest()
                  }}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-2 text-center text-[13px] font-semibold transition-all active:scale-95 ${
                    silenced
                      ? 'bg-tertiary-fixed text-on-tertiary-fixed ring-2 ring-tertiary-fixed-dim'
                      : 'bg-surface-container text-primary hover:bg-surface-container-high disabled:opacity-50'
                  }`}
                >
                  {silenced ? 'Yanıt İletildi ✓' : 'Zili Sustur / Yanıttayım'}
                </button>
                <button
                  type="button"
                  title="Kamera Görüntüsüne Bak"
                  onClick={() => {
                    setCamActive((v) => !v)
                    setCamNote(true)
                  }}
                  className={`flex items-center justify-center rounded-md px-3 py-2 transition-all active:scale-90 ${
                    camActive
                      ? 'bg-primary-fixed text-primary'
                      : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <Icon name="videocam" className="text-[20px]" />
                </button>
              </div>
              {camNote && (
                <p className="mt-2 text-[12px] text-on-surface-variant">
                  Bu sürümde kapı kamerası bağlı değil; yalnızca akustik uyarı çalışır.
                </p>
              )}
            </div>

            <div className="mt-space-xs flex flex-col rounded-lg bg-surface-container-lowest p-space-sm shadow-sm">
              <div className="px-3 py-2 text-[13px] font-bold text-on-surface-variant">
                Bugünkü Akustik Geçmiş
              </div>
              {radar.history.length === 0 && (
                <p className="px-3 py-3 text-sm text-on-surface-variant">
                  Bu oturumda henüz kritik ses kaydı yok. Geçmiş tarayıcı kapanınca silinir;
                  ses kaydı tutulmaz.
                </p>
              )}
              {radar.history.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 rounded-md p-3 transition-all hover:bg-surface-container-low"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-surface-container-high text-primary">
                    <Icon name={item.icon} className="text-[22px]" />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-center justify-between">
                      <span className="truncate text-[15px] font-semibold text-on-surface">
                        {item.label} algılandı
                      </span>
                      <span className="ml-2 shrink-0 text-[11px] font-bold text-outline">
                        {formatClock(item.at)}
                      </span>
                    </div>
                    <p className="mt-0.5 line-clamp-1 text-sm text-on-surface-variant">
                      {item.matchedClass} • %{Math.round(item.score * 100)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {debugYamnet && (
            <section className="rounded-lg bg-on-surface p-space-md text-surface-container-lowest">
              <h3 className="text-sm font-bold tracking-wide uppercase">YAMNet doğrulama</h3>
              <p className="mt-1 text-[12px] opacity-80">
                Model {radar.modelReady ? 'yüklü' : 'yüklenmedi'} • durum: {radar.status}
                {radar.lastInferMs != null ? ` • çıkarım ${radar.lastInferMs} ms` : ''}
              </p>
              <ol className="mt-2 space-y-1 text-sm">
                {radar.topClasses.length === 0 && <li>Henüz sınıf yok — dinlemeyi başlatın.</li>}
                {radar.topClasses.map((row, i) => (
                  <li key={`${row.index}-${i}`}>
                    {i + 1}. {row.name} ({row.index}) — {(row.score * 100).toFixed(1)}%
                  </li>
                ))}
              </ol>
            </section>
          )}

          <section className="relative flex flex-col overflow-hidden rounded-lg bg-surface-container-low p-space-md shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-error">
                <Icon name="shield_with_heart" filled className="text-[22px]" />
                <h3 className="text-lg font-bold text-on-surface">Sessiz S.O.S.</h3>
              </div>
              <span className="rounded-full bg-surface-container px-2 py-0.5 text-[11px] font-medium text-on-surface-variant">
                Gizli Yardım
              </span>
            </div>

            <div className="relative w-full overflow-hidden rounded-lg">
              <button
                type="button"
                onClick={startSos}
                disabled={sosState === 'sent'}
                className={`sos-danger-glow group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-lg px-space-md py-4 shadow-md transition-all select-none active:scale-95 ${
                  sosState === 'sent' ? 'bg-tertiary-container' : 'bg-error'
                } text-on-error`}
              >
                <div
                  className="pointer-events-none absolute top-0 bottom-0 left-0 bg-white/25 transition-[width] duration-[3000ms] ease-linear"
                  style={{ width: progressOn && sosState === 'counting' ? '100%' : '0%' }}
                />
                <Icon
                  name={sosState === 'sent' ? 'check_circle' : sosState === 'counting' ? 'warning' : 'emergency'}
                  className="shrink-0 animate-pulse text-[30px]"
                />
                <span className="relative z-10 text-xl font-semibold tracking-wide">
                  {sosState === 'sent'
                    ? 'Sessiz S.O.S. İletildi!'
                    : sosState === 'counting'
                      ? `Sessiz S.O.S. (İptal: ${sosSeconds}s)`
                      : 'Sessiz S.O.S. Gönder'}
                </span>
              </button>
            </div>

            {sosState === 'counting' && (
              <div className="mt-2 flex items-center justify-between rounded-md bg-error-container px-2 py-1.5 text-sm font-medium text-on-error-container">
                <div className="flex items-center gap-2">
                  <Icon name="progress_activity" className="animate-spin text-[18px]" />
                  <span>3 sn içinde SMS gönderiliyor...</span>
                </div>
                <button
                  type="button"
                  onClick={cancelSos}
                  className="rounded bg-on-error px-2 py-1 text-[11px] font-bold tracking-wider text-error uppercase transition-transform active:scale-95"
                >
                  İptal Et
                </button>
              </div>
            )}

            {sosState === 'sent' && (
              <div className="mt-2 flex items-center rounded-md bg-error-container px-2 py-1.5 text-[12px] font-bold text-on-error-container">
                <span className="flex items-center gap-1.5">
                  <Icon name="done_all" className="text-[16px]" />
                  Canlı konum 3 yakına sessizce aktarıldı.
                </span>
              </div>
            )}

            <div className="mt-3 flex items-start gap-2 px-1">
              <Icon name="info" className="mt-0.5 shrink-0 text-[18px] text-outline" />
              <p className="text-sm text-on-surface-variant">
                <strong>112 alternatifi değildir.</strong> Tanımlı 3 acil durum yakınınıza
                canlı konumunuzu ve &quot;Güvende Değilim&quot; durum SMS&apos;ini anında
                sessizce ulaştırır.
              </p>
            </div>

            <div className="mt-space-md flex flex-col gap-2 pt-space-sm">
              <span className="text-[11px] font-bold tracking-wider text-outline uppercase">
                Bildirilecek Yakınlar
              </span>
              <div className="grid grid-cols-3 gap-2">
                {contacts.map((c) => (
                  <div
                    key={c.name}
                    className="flex cursor-pointer flex-col items-center rounded-md bg-surface-container-lowest p-2 text-center shadow-sm transition-transform hover:scale-105"
                  >
                    <div
                      className={`mb-1 flex h-8 w-8 items-center justify-center rounded-full text-[13px] font-bold ${c.tone}`}
                    >
                      {c.initial}
                    </div>
                    <span className="w-full truncate text-[13px] font-semibold text-on-surface">
                      {c.name}
                    </span>
                    <span className="mt-0.5 flex items-center gap-0.5 text-[10px] text-tertiary-container">
                      <span className="h-1.5 w-1.5 rounded-full bg-tertiary-fixed-dim" /> Aktif
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  )
}
