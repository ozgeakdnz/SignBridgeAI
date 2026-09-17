import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AppHeader } from '../components/layout'
import { Icon } from '../components/Icon'
import { useRadar } from '../lib/radar/RadarProvider'
import type { SoundType } from '../lib/radar/soundClasses'

const ALI_IMG =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAeAQqxk62dPxG6Y82S5r82XLntBvlu_6SuFBFvgqAoDls6FCwgkbF_nNJ-Knbz2vv8nDmhMjeJfvtTImTRFYZ_B4dHBNJRB3ZULTdHZIFw3SsTz7VKH6D4s0b1np4F92ibm6mMbR-eEVd3FsZWBeMq5_Qzv1R-SGQ0AoBxIzvhFTxg_6-UV2vJ29LSzP7151Ut2tKwEb7h8N3Qz95EVII1D3PyAz2JTT-aRk01P7cxVjEtw8V0mI7a'
const ZEYNEP_IMG =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCrb-C2TfeLQOkDKCV3q-s4nnofiGgeNiwkDugoYHTGXMng38AWjKHUzOO7Cwjdxp7fBZDYdzZIBWU7iHbOB4C1ya9Dx95u_8mr98dyd_G_cOj4FYRCjweCAVEijCs4fSmXvsM7g0cuU60wqkRRib0PYyt1mdTZc-TpJ1TK3FSWo2JrZG_BmXHlFN-PyWHADZb0w98JQLaY7zssuSxT9ZLpMRFA8BGPXzRmvYU2eHzrdWHanFdgt5fw'
const CAN_IMG =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDZKZrDhpJuOOhZL04f02SflUo03ylIITpfhJb1JP2uRCZhAQR9qtsvIqfmLPac79eYd6Q7_Ayetw2ns9sb7UHhQuH5PGw6lbIUMSQvfFX8Kht-LrqGMpHUB1n_Xj5OrGSuHk0JuPMtcXbNR3eDKjaiSpDpzqNnw3enbEVW2CSQqZM4O_d-fcUGiWdb8yQSdAtj1LXsgzQDvEkZoBY4ioRGL62Cnwg_IawML-ZClvXj5TulLOfuGRjU'

const captionSizes = ['18px Orta', '24px Büyük', '32px XL'] as const
const vibeLevels = ['Hafif', 'Dengeli', 'Güçlü'] as const

type RadarToggleKey = SoundType | 'strobe'

function Toggle({
  on,
  onToggle,
  label,
}: {
  on: boolean
  onToggle: () => void
  label: string
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-checked={on}
      role="switch"
      onClick={onToggle}
      className={`flex h-7 w-12 items-center rounded-full p-0.5 shadow-inner transition-all duration-300 active:scale-95 ${
        on ? 'justify-end bg-primary' : 'justify-start bg-surface-container-highest'
      }`}
    >
      <span className="h-6 w-6 rounded-full bg-surface-container-lowest shadow-md transition-all duration-300" />
    </button>
  )
}

export function ProfilPage() {
  const radar = useRadar()
  const [toast, setToast] = useState<{ msg: string; icon: string } | null>(null)
  const [captionIdx, setCaptionIdx] = useState(1)
  const [kiosk, setKiosk] = useState(true)

  const showToast = (msg: string, icon = 'check_circle') => setToast({ msg, icon })

  useEffect(() => {
    if (!toast) return
    const id = window.setTimeout(() => setToast(null), 2600)
    return () => window.clearTimeout(id)
  }, [toast])

  const flipRadar = (key: RadarToggleKey, name: string) => {
    const next = !radar.settings[key]
    radar.setToggle(key, next)
    showToast(`${name} ${next ? 'açıldı' : 'kapatıldı'}`)
  }

  const triggerStrobe = () => {
    radar.triggerStrobeTest()
    showToast('Flaşör LED test edildi', 'flash_on')
  }

  return (
    <>
      <AppHeader subtitle="Profil & Ayarlar" />
      <main className="relative flex min-h-dvh w-full flex-col bg-surface pb-24 pt-16">
        <div className="flex w-full flex-col space-y-space-lg px-margin pb-space-xl">
          {/* Profile */}
          <section className="rounded-lg bg-surface-container-lowest p-space-md shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center gap-space-md">
              <div className="group relative shrink-0">
                <img
                  src={ALI_IMG}
                  alt="Ali Yılmaz"
                  className="h-16 w-16 rounded-full object-cover shadow-sm ring-2 ring-primary/10 transition-transform duration-300 group-hover:scale-105"
                />
                <span className="absolute right-0 bottom-0 flex h-4 w-4 items-center justify-center rounded-full bg-tertiary-fixed-dim shadow-sm ring-2 ring-surface-container-lowest">
                  <span className="h-1.5 w-1.5 animate-ping rounded-full bg-white" />
                </span>
                <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-on-primary shadow-sm">
                  <Icon name="verified" filled className="text-[13px]" />
                </div>
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-center gap-1.5">
                  <h1 className="truncate text-xl font-semibold text-on-surface">Ali Yılmaz</h1>
                  <span className="inline-block h-2 w-2 shrink-0 animate-pulse rounded-full bg-tertiary-fixed-dim" />
                </div>
                <p className="truncate text-sm text-on-surface-variant">
                  İşitme Engelli Kullanıcı • Aile Üyesi
                </p>
                <span className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-semibold text-primary">
                  <Icon name="sign_language" className="text-[13px]" /> TİD Ana Dil Kullanıcısı
                </span>
              </div>
            </div>

            <div className="shimmer-badge relative mt-space-md flex items-center justify-between gap-space-sm overflow-hidden rounded-md border border-surface-container bg-surface-container-low p-space-sm transition-transform hover:scale-[1.01]">
              <div className="z-10 flex min-w-0 items-center gap-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary-container/20">
                  <Icon name="shield_with_heart" filled className="text-[20px] text-secondary" />
                </div>
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-[13px] font-bold text-on-surface">
                    Aile &amp; Güvenlik Paketi
                  </span>
                  <span className="text-[11px] font-bold text-on-surface-variant">
                    Aktif • 149 TL / ay
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => showToast('Abonelik yönetimi açılıyor...')}
                className="z-10 shrink-0 rounded-md bg-surface-container-lowest px-3 py-1.5 text-[13px] font-semibold text-primary shadow-sm transition-all hover:bg-primary hover:text-on-primary active:scale-95"
              >
                Yönet
              </button>
            </div>

            <div className="no-scrollbar mt-space-md flex items-center gap-2 overflow-x-auto pb-1">
              {[
                { icon: 'qr_code_2', label: 'QR Kodum', msg: 'Kişisel QR Kodunuz hazırlandı', toastIcon: 'qr_code_2' },
                { icon: 'edit', label: 'Profili Düzenle', msg: 'Profil düzenleme modu aktif', toastIcon: 'edit' },
                { icon: 'devices', label: '3 Cihaz Bağlı', msg: '3 Cihaz: iPhone 14 Pro, Apple Watch S9, Akıllı Kiosk', toastIcon: 'devices' },
              ].map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => showToast(chip.msg, chip.toastIcon)}
                  className="flex shrink-0 items-center gap-1.5 rounded-md bg-surface-container px-3 py-2 text-[13px] font-semibold text-on-surface shadow-sm transition-all duration-200 hover:bg-surface-container-high active:scale-95"
                >
                  <Icon
                    name={chip.icon}
                    className={`text-[18px] ${chip.icon === 'devices' ? 'animate-pulse text-tertiary-container' : 'text-primary'}`}
                  />
                  <span>{chip.label}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Hearing prefs */}
          <section className="flex flex-col space-y-space-sm">
            <div className="flex items-center gap-2 px-1">
              <Icon name="hearing" className="text-[22px] text-primary" />
              <h2 className="text-lg font-semibold text-on-surface">
                İşitme &amp; İletişim Tercihleri
              </h2>
            </div>
            <div className="space-y-space-md rounded-lg bg-surface-container-lowest p-space-md shadow-sm">
              <button
                type="button"
                onClick={() => showToast('TİD Lehçe & 3D Avatar ayarları açılıyor')}
                className="-m-1 flex cursor-pointer items-center justify-between gap-space-sm rounded-md p-1 transition-colors hover:bg-surface-container-low/50"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-surface-container-low text-primary">
                    <Icon name="sign_language" className="text-[22px]" />
                  </div>
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-[15px] font-bold text-on-surface">
                      TİD Tercihi &amp; 3D Avatar
                    </span>
                    <span className="truncate text-sm text-on-surface-variant">
                      İstanbul Lehçesi • 3D Avatar Açık
                    </span>
                  </div>
                </div>
                <Icon name="chevron_right" className="text-[20px] text-on-surface-variant" />
              </button>

              <div className="h-px w-full bg-surface-container-low" />

              <div className="flex flex-col space-y-space-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-surface-container-low">
                      <Icon name="subtitles" className="text-[22px] text-primary" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[15px] font-bold text-on-surface">
                        Konuşma Algılama &amp; Altyazı
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm text-on-surface-variant">Yüksek Hassasiyet</span>
                        <span className="flex items-center gap-0.5">
                          <span className="h-2 w-1 animate-bounce rounded-full bg-primary" />
                          <span
                            className="h-3 w-1 animate-bounce rounded-full bg-primary"
                            style={{ animationDelay: '150ms' }}
                          />
                          <span
                            className="h-2 w-1 animate-bounce rounded-full bg-primary"
                            style={{ animationDelay: '300ms' }}
                          />
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCaptionIdx((i) => (i + 1) % captionSizes.length)}
                    className="rounded-full border border-primary/20 bg-surface-container-low px-2.5 py-1 text-[11px] font-bold text-primary transition-colors hover:bg-primary-fixed active:scale-95"
                  >
                    {captionSizes[captionIdx]}
                  </button>
                </div>
                <div className="relative mt-1 flex flex-col space-y-1 overflow-hidden rounded-md border border-surface-container bg-surface-container-low p-3">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-[11px] font-bold tracking-wider text-on-surface-variant uppercase">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-error" />
                      Canlı Altyazı Önizlemesi
                    </span>
                  </div>
                  <p
                    className="min-h-[3.2rem] leading-tight font-bold text-on-surface transition-all duration-300"
                    style={{
                      fontSize: captionIdx === 0 ? 18 : captionIdx === 1 ? 24 : 28,
                    }}
                  >
                    &quot;Merhaba Ali Bey, toplantıya hazır mıyız?&quot;
                    <span className="cursor-blink ml-1 inline-block h-6 w-2.5 align-middle bg-primary" />
                  </p>
                </div>
              </div>

              <div className="h-px w-full bg-surface-container-low" />

              <div className="flex items-center justify-between gap-space-sm">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-surface-container-low">
                    <Icon name="record_voice_over" className="text-[22px] text-primary" />
                  </div>
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-[15px] font-bold text-on-surface">
                      Yaz-Konuş Ses Tonu
                    </span>
                    <span className="truncate text-sm text-on-surface-variant">
                      Doğal Türkçe AI • Erkek (Sakin)
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  aria-label="Sesi Dinle"
                  onClick={() => showToast('Örnek ses oynatılıyor...', 'volume_up')}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-container text-primary transition-all duration-200 hover:bg-primary hover:text-on-primary active:scale-90"
                >
                  <Icon name="volume_up" className="text-[18px]" />
                </button>
              </div>
            </div>
          </section>

          {/* Haptic & radar */}
          <section className="flex flex-col space-y-space-sm">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Icon name="vibration" className="text-[22px] text-secondary" />
                <h2 className="text-lg font-semibold text-on-surface">
                  Dokunsal (Haptik) &amp; Radar Bildirimleri
                </h2>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-secondary-container/20 px-2 py-0.5 text-[11px] font-semibold text-secondary">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    radar.status === 'listening' ? 'animate-ping bg-secondary' : 'bg-outline-variant'
                  }`}
                />
                <span>
                  {radar.status === 'listening' ? 'Haptik Motor Aktif' : 'Radar kapalı'}
                </span>
              </div>
            </div>
            <div className="space-y-space-md rounded-lg bg-surface-container-lowest p-space-md shadow-sm">
              <div className="flex flex-col space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[15px] font-medium text-on-surface">
                    Titreşim Şiddeti Seviyesi
                  </span>
                  <span className="text-[13px] font-bold text-secondary">{radar.settings.vibration}</span>
                </div>
                <div className="relative grid select-none grid-cols-3 gap-1 rounded-lg bg-surface-container-low p-1">
                  {vibeLevels.map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => {
                        radar.setVibration(level)
                        showToast(`Titreşim: ${level}`, 'vibration')
                      }}
                      className={`rounded-md py-2 text-center text-[13px] transition-all duration-200 active:scale-95 ${
                        radar.settings.vibration === level
                          ? 'bg-surface-container-lowest font-bold text-primary shadow-sm ring-1 ring-black/5'
                          : 'font-semibold text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-px w-full bg-surface-container-low" />

              <div className="space-y-space-md">
                <span className="block text-[11px] font-bold tracking-wider text-on-surface-variant uppercase">
                  Kritik Ses Filtreleri (Canlı Radar)
                </span>
                {(
                  [
                    {
                      key: 'doorbell' as const,
                      icon: 'doorbell',
                      iconClass: 'text-primary',
                      box: 'bg-surface-container-low',
                      title: 'Kapı Zili Algılama',
                      desc: 'Çift Uzun Titreşim deseni',
                    },
                    {
                      key: 'siren' as const,
                      icon: 'emergency_home',
                      iconClass: 'animate-pulse text-error',
                      box: 'bg-error-container/40',
                      title: 'Yangın & Siren Alarmı',
                      desc: 'Sürekli Nabız (Yüksek Öncelik)',
                    },
                    {
                      key: 'baby' as const,
                      icon: 'child_care',
                      iconClass: 'text-secondary',
                      box: 'bg-surface-container-low',
                      title: 'Bebek Ağlaması',
                      desc: 'Dalgalı Titreşim bildirimi',
                    },
                    {
                      key: 'horn' as const,
                      icon: 'directions_car',
                      iconClass: 'text-primary',
                      box: 'bg-surface-container-low',
                      title: 'Araba Kornası',
                      desc: 'Dış mekan modunda aktif',
                    },
                  ] as const
                ).map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between gap-space-sm rounded-md p-1.5 transition-colors hover:bg-surface-container-low/40"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <div
                        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${item.box}`}
                      >
                        <Icon name={item.icon} className={`text-[20px] ${item.iconClass}`} />
                      </div>
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate text-[15px] font-bold text-on-surface">
                          {item.title}
                        </span>
                        <span className="text-sm text-on-surface-variant">{item.desc}</span>
                      </div>
                    </div>
                    <Toggle
                      on={radar.settings[item.key]}
                      label={item.title}
                      onToggle={() => flipRadar(item.key, item.title)}
                    />
                  </div>
                ))}
              </div>

              <div className="h-px w-full bg-surface-container-low" />

              <div className="flex items-center justify-between gap-space-sm rounded-md p-1.5 transition-colors hover:bg-surface-container-low/40">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-secondary-container/20">
                    <Icon name="flash_on" className="text-[22px] text-secondary" />
                  </div>
                  <div className="flex min-w-0 flex-col">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-[15px] font-bold text-on-surface">
                        Flaşör LED Bildirimi
                      </span>
                      <button
                        type="button"
                        onClick={triggerStrobe}
                        className="rounded bg-secondary/15 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-secondary uppercase transition-colors hover:bg-secondary hover:text-white"
                      >
                        Test Et
                      </button>
                    </div>
                    <span className="truncate text-sm text-on-surface-variant">
                      Ekran ve arka flaş yanıp sönsün
                    </span>
                  </div>
                </div>
                <Toggle
                  on={radar.settings.strobe}
                  label="Flaşör LED"
                  onToggle={() => flipRadar('strobe', 'Flaşör LED')}
                />
              </div>
            </div>
          </section>

          {/* SOS contacts */}
          <section className="flex flex-col space-y-space-sm">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <div className="relative flex items-center justify-center">
                  <span className="absolute h-3 w-3 animate-ping rounded-full bg-error opacity-60" />
                  <Icon name="sos" className="relative z-10 text-[22px] text-error" />
                </div>
                <h2 className="text-lg font-bold text-on-surface">Acil Durum &amp; Sessiz S.O.S.</h2>
              </div>
              <span className="flex items-center gap-1 rounded-full bg-error-container px-2.5 py-0.5 text-[11px] font-bold text-on-error-container shadow-sm">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-error" />
                3 Tanımlı
              </span>
            </div>
            <div className="space-y-space-md rounded-lg border border-error-container/30 bg-surface-container-lowest p-space-md shadow-sm">
              <p className="text-sm leading-relaxed text-on-surface-variant">
                Tehlike anında ses çıkarmadan güç tuşuna 3 kez bastığınızda konumunuz ve canlı TİD
                mesajınız seçilen kişilere iletilir.
              </p>
              <div className="space-y-3">
                {[
                  { name: 'Zeynep Yılmaz', role: 'Anne', img: ZEYNEP_IMG, loc: true },
                  { name: 'Can Yılmaz', role: 'Kardeş', img: CAN_IMG, loc: true },
                  { name: 'Ahmet Bey', role: 'Komşu', img: null, loc: false },
                ].map((c) => (
                  <div
                    key={c.name}
                    className="flex flex-col rounded-md border border-transparent bg-surface-container-low p-2.5 transition-all duration-200 hover:border-primary/20 hover:bg-surface-container hover:shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex min-w-0 items-center gap-3">
                        {c.img ? (
                          <img
                            src={c.img}
                            alt={c.name}
                            className="h-11 w-11 shrink-0 rounded-full object-cover shadow-sm ring-1 ring-primary/20"
                          />
                        ) : (
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-container text-lg font-bold text-primary ring-1 ring-primary/20">
                            A
                          </div>
                        )}
                        <div className="flex min-w-0 flex-col">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate text-[15px] font-semibold text-on-surface">
                              {c.name}
                            </span>
                            <span
                              className={`rounded px-1.5 text-[11px] font-medium ${
                                c.role === 'Komşu'
                                  ? 'bg-surface-container-high text-on-surface-variant'
                                  : 'bg-primary/10 text-primary'
                              }`}
                            >
                              {c.role}
                            </span>
                          </div>
                          <div className="mt-0.5 flex items-center gap-2">
                            <span
                              className={`flex items-center gap-0.5 text-[11px] font-bold ${
                                c.loc ? 'text-tertiary-container' : 'text-on-surface-variant'
                              }`}
                            >
                              <Icon name="sms" className="text-[14px]" />{' '}
                              {c.loc ? 'SMS' : 'SMS Bildirimi'}
                            </span>
                            {c.loc && (
                              <span className="flex items-center gap-0.5 text-[11px] font-bold text-tertiary-container">
                                <Icon name="my_location" className="text-[14px]" /> Canlı Konum
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          showToast(`S.O.S. test: ${c.name} (${c.role})`, 'sos')
                        }
                        className="rounded bg-surface-container-lowest px-2 py-1 text-xs font-semibold text-primary transition-all hover:bg-primary hover:text-white active:scale-90"
                      >
                        Test
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => showToast('Yeni acil durum kişisi ekleniyor...', 'person_add')}
                className="group flex w-full items-center justify-center gap-2 rounded-md border border-primary/10 bg-surface-container-low px-4 py-3 text-[15px] font-bold text-primary transition-all hover:bg-surface-container active:scale-[0.98]"
              >
                <Icon
                  name="person_add"
                  className="text-[20px] transition-transform duration-200 group-hover:rotate-90"
                />
                <span>+ Yeni Acil Durum Kişisi Ekle</span>
              </button>
            </div>
          </section>

          {/* Kiosk */}
          <section className="flex flex-col space-y-space-sm">
            <div className="flex items-center gap-2 px-1">
              <Icon name="apartment" className="text-[22px] text-primary" />
              <h2 className="text-lg font-semibold text-on-surface">
                Kurumsal &amp; Kiosk Bağlantısı
              </h2>
            </div>
            <div className="space-y-space-sm rounded-lg bg-surface-container-lowest p-space-md shadow-sm">
              <div className="flex items-start justify-between gap-space-sm">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-surface-container-low">
                    <Icon name="contactless" className="text-[22px] text-primary" />
                  </div>
                  <div className="flex min-w-0 flex-col">
                    <span className="text-[15px] font-semibold text-on-surface">
                      Kamu &amp; Kiosk Otomatik Eşleşme
                    </span>
                    <p className="mt-0.5 text-sm leading-relaxed text-on-surface-variant">
                      İBB Şehir Hatları, Devlet Hastaneleri ve anlaşmalı banka kiosklarına
                      yaklaştığınızda sıra numaranızı ve sesli anonsları anlık TİD videosuna
                      çevirir.
                    </p>
                  </div>
                </div>
                <Toggle
                  on={kiosk}
                  label="Kiosk"
                  onToggle={() => {
                    setKiosk((v) => {
                      showToast(`Kamu & Kiosk Eşleşme ${!v ? 'açıldı' : 'kapatıldı'}`)
                      return !v
                    })
                  }}
                />
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                {['İBB Vapurları', 'MHRS Hastane Sıramatik', 'Ziraat / İş Bankası'].map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 rounded-md bg-surface-container-low px-2.5 py-1 text-[11px] font-bold text-on-surface-variant"
                  >
                    <Icon name="check_circle" className="text-[14px] text-tertiary-container" />{' '}
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </section>

          {/* Account */}
          <section className="flex flex-col space-y-space-sm">
            <div className="flex items-center gap-2 px-1">
              <Icon name="manage_accounts" className="text-[22px] text-primary" />
              <h2 className="text-lg font-semibold text-on-surface">Hesap &amp; Destek</h2>
            </div>
            <div className="divide-y divide-surface-container-low rounded-lg bg-surface-container-lowest p-space-xs shadow-sm">
              {[
                { icon: 'credit_card', label: 'Abonelik & Ödeme Detayları' },
                { icon: 'menu_book', label: 'TİD Sözlüğü & Yeni İşaret Bildir', sub: 'Topluluk onaylı 4.200 kelime' },
                { icon: 'privacy_tip', label: 'Gizlilik & KVKK Politikası' },
              ].map((row) => (
                <button
                  key={row.label}
                  type="button"
                  onClick={() => showToast(`${row.label} açılıyor`)}
                  className="group flex w-full items-center justify-between rounded-md p-3.5 text-left transition-all hover:bg-surface-container-low active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      name={row.icon}
                      className="text-[22px] text-on-surface-variant transition-colors group-hover:text-primary"
                    />
                    <div className="flex flex-col">
                      <span className="text-[15px] font-bold text-on-surface">{row.label}</span>
                      {'sub' in row && row.sub && (
                        <span className="text-sm text-on-surface-variant">{row.sub}</span>
                      )}
                    </div>
                  </div>
                  <Icon
                    name="chevron_right"
                    className="text-[20px] text-on-surface-variant transition-transform group-hover:translate-x-1 group-hover:text-primary"
                  />
                </button>
              ))}
              <button
                type="button"
                onClick={() => showToast('Oturum kapatılıyor...', 'logout')}
                className="flex w-full items-center gap-3 rounded-md p-3.5 text-left text-error transition-all hover:bg-error-container/40 active:scale-[0.99]"
              >
                <Icon name="logout" className="text-[22px]" />
                <span className="text-[15px] font-bold">Oturumu Kapat</span>
              </button>
            </div>
          </section>

          <div className="flex flex-col items-center gap-1 pb-2 text-center">
            <p className="text-[11px] font-medium text-on-surface-variant">
              Erişilebilir Yaşam İçin Birlikte Tasarlandı
            </p>
            <p className="text-[10px] text-outline">
              SignBridge AI v2.4.1 (Build 412) • Türkiye
            </p>
            <Link to="/kopru" className="mt-2 text-[11px] font-bold text-primary">
              Ana ekrana dön
            </Link>
          </div>
        </div>

        <div
          className={`fixed bottom-20 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full bg-on-surface px-4 py-2 text-[13px] font-semibold text-surface-container-lowest shadow-lg transition-all duration-300 ${
            toast
              ? 'pointer-events-auto translate-y-0 opacity-100'
              : 'pointer-events-none translate-y-3 opacity-0'
          }`}
        >
          <Icon name={toast?.icon ?? 'check_circle'} className="text-[18px] text-tertiary-fixed-dim" />
          <span>{toast?.msg}</span>
        </div>
      </main>
    </>
  )
}
