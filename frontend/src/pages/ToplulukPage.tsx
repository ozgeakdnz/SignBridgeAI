import { useEffect, useState } from 'react'
import { AppHeader } from '../components/layout'
import { Icon } from '../components/Icon'
import { useRadar } from '../lib/radar/RadarProvider'
import type { VibrationLevel } from '../lib/radar/soundClasses'

type Filter = 'all' | 'tid' | 'volunteer' | 'news'

const EVENT_IMG =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDKo2BIndhHIvjAMlxezB0fr4cm3zPXEIHGOK_LRsjEB8hT2gw4brkaGou0yJLdzZcA5ZDwx5DlzmyyUpjqmRCphBaqR6jHL4F1ua-ZFBa3kuCQDXwdPoUgK1tETdpza_dMgvoavec9W2Zx0lqe-Ze3wWXISbCkjPizixC2a1bzYjZz2ZuOvXvJUd2s25HiHBKmFBfN_1wm8tuxA953-HBhSeNX3L9utEbpMXApnV2BMmXYdjPwv58q'
const AVATARS = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDgmHXk5E7_2qxqycOpaXLiCx07L1XuiJu4DnBosRiPjSAKDeCcxXqKHAuFTa_8ud0pzpNB-Kt2cKU4fcWEPlS1pRTGQtNKoilUbX7ClNgAnBj105TebET4AAEA_1H8jB3O-56FgZ2fhduaKkMUVTBmkz6KKQYU0Y7SUwgzvUMeFAkKWnphSb1qtW43Y8r7y9Mr2xW-bgnnsJHc1itS5yPVSgGhMVgozpxKGKJG8H_wPPsIS4GAhUfb',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuD6Cg9T64U8akv1x780AorgBhazgjFZy2D-j-9hACEtN9my8n_yYxt2BEbvY_CeiHRtX-tg5DK4-bF-2brSXGv1FPYzKOjjug6dgWIduGkCCAI1ywxL_-a9dONSs6H7EAPHp61nANV9VMo8LEgxPk5woFTPYPCYNhnxNPgu-U1QRrjuq9PVysctVJfScmiaTeH_YxC-bZmbJXKMukZ3W0IfY7TfvyBD-N0E8dTpM6phlP5UrmgjSwyC',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAFHq1ApU3msfV-k0zNQjHOjiQCFlqYIumMnX7UASyJ3NUORnv77r9m2uAAOrc7EnI9Nu4-sXiIkXEGzgoKg5Gp2jA_8eY2Md1MCUNVrkU74Mocpi5fiqgwl-AG2NRcmm5_6Y4Z-uanwPQmOELuPcCnz4oV0j5jL1gL7XpX9GQCEw0uiuGvtNy1CWno84MzdASB5hsHHS6BQoQhAyUPDZ6RCIfgV_YbSqIF6CyboB7KZSKY2272e29r',
]
const SELIN_IMG =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDC2vfJNBcWNeoqDdlgOLC5-J5VPaKxTGnFqG5ASgDNiXLkQ_vNITFJLRW499oBfX-pB4MEftlFi6kZlucWuHEdkPqPW61wtoDMcGaXLYZg2V90s0KbrY2J47R2sVNZYDbpIcN4Grcs628JqLr0sNj8Q8jlvBN3v-y9EKnUljWUFmBybgvsR39vSenpPCPLxZzKDVSeCCAks7U9igiiwIYTuYejBwKlFYNO00EsYZT3bqes05-vnmqv'
const ALI_IMG =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAZgwTvRG4jVn2bgF5BV6f6lPljYg-jxQ0CBFPANHFp6-cM1XjeEWd7qm_OhmbZAn32x3EQqie7Oo8ROT_fMvr8uiTIAqOjSb8S9EGs0FSSsSKohb8Gc8SINy_JD4IHUXGQ3WS8gqiLlLFCr36hOqEWnBCPuQteuiLo1vc-wLAoFPImSDavqD-JUMU9Qz28iCU4Zj9dadHZWFFRUrEBCxDtS3vV2MmWRI2GoytyRmQTgI1yB1DLVWXF'

const filters: { id: Filter; label: string; icon: string }[] = [
  { id: 'all', label: 'Tüm Etkinlikler', icon: 'celebration' },
  { id: 'tid', label: 'TİD Pratiği', icon: 'front_hand' },
  { id: 'volunteer', label: 'Gönüllüler', icon: 'volunteer_activism' },
  { id: 'news', label: 'Duyurular', icon: 'campaign' },
]

const vibeLevels = [
  { name: 'Güçlü' as VibrationLevel, desc: 'Dokunsal Haptik: Güçlü Mod' },
  { name: 'Dengeli' as VibrationLevel, desc: 'Dokunsal Haptik: Dengeli Mod' },
  { name: 'Hafif' as VibrationLevel, desc: 'Dokunsal Haptik: Hafif Mod' },
] as const

const emergencyContacts = [
  { initial: 'A', name: 'Fatma Yılmaz (Anne)', phone: '0532 ••• •• 12', priority: '1. Öncelik', primary: true },
  { initial: 'E', name: 'Emre Yılmaz (Kardeş)', phone: '0541 ••• •• 45', priority: '2. Öncelik', primary: false },
  { initial: 'M', name: 'Mehmet Demir (Komşu / İş)', phone: '0505 ••• •• 89', priority: '3. Öncelik', primary: false },
]

export function ToplulukPage() {
  const radar = useRadar()
  const [filter, setFilter] = useState<Filter>('all')
  const [joined, setJoined] = useState(false)
  const [confetti, setConfetti] = useState(false)
  const [msgSent, setMsgSent] = useState(false)
  const [guideOpen, setGuideOpen] = useState(false)
  const [bookmarked, setBookmarked] = useState(false)
  const [vibrating, setVibrating] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [toast, setToast] = useState<{ msg: string; icon: string } | null>(null)

  const showToast = (msg: string, icon = 'check_circle') => {
    setToast({ msg, icon })
  }

  useEffect(() => {
    if (!toast) return
    const id = window.setTimeout(() => setToast(null), 2600)
    return () => window.clearTimeout(id)
  }, [toast])

  useEffect(() => {
    if (!modalOpen) return
    const id = window.setTimeout(() => setModalVisible(true), 10)
    return () => window.clearTimeout(id)
  }, [modalOpen])

  const closeModal = () => {
    setModalVisible(false)
    window.setTimeout(() => setModalOpen(false), 300)
  }

  const onJoin = () => {
    const next = !joined
    setJoined(next)
    if (next) {
      setConfetti(true)
      window.setTimeout(() => setConfetti(false), 1200)
      showToast('Etkinlik takviminize kaydedildi! 📅')
    } else {
      showToast('Etkinlik kaydınız kaldırıldı.', 'info')
    }
  }

  const vibeIndex = Math.max(
    0,
    vibeLevels.findIndex((v) => v.name === radar.settings.vibration),
  )
  const radarOn = radar.status === 'listening' || radar.status === 'starting'

  const onVibe = () => {
    const next = vibeLevels[(vibeIndex + 1) % vibeLevels.length]
    radar.setVibration(next.name)
    setVibrating(false)
    requestAnimationFrame(() => {
      setVibrating(true)
      window.setTimeout(() => setVibrating(false), 350)
    })
    showToast(`Titreşim seviyesi: ${next.name}`, 'vibration')
  }

  return (
    <>
      <AppHeader subtitle="Topluluk" />
      <main className="relative flex min-h-dvh w-full flex-col bg-surface pb-24 pt-16">
        <div className="flex w-full flex-col">
          <div className="animate-fade-in-1 flex items-center justify-between px-margin pt-space-md pb-space-xs">
            <div className="flex flex-col">
              <div className="flex items-center gap-space-xs">
                <span className="ping-badge inline-block h-2.5 w-2.5 rounded-full bg-tertiary-fixed-dim" />
                <span className="text-[11px] font-bold tracking-wider text-tertiary-container uppercase">
                  Aktif Dayanışma Ağı
                </span>
              </div>
              <h1 className="mt-0.5 text-[26px] leading-[34px] font-bold tracking-tight text-primary">
                SignBridge Topluluk
              </h1>
            </div>
            <button
              type="button"
              aria-label="Yeni Gönderi Paylaş"
              onClick={() => showToast('Topluluk gönderi paneli açılıyor...', 'post_add')}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-high text-primary shadow-sm transition-all duration-200 hover:rotate-6 hover:bg-surface-container-highest active:scale-90"
            >
              <Icon name="add_comment" className="text-[22px]" />
            </button>
          </div>

          <div className="animate-fade-in-1 no-scrollbar flex w-full items-center gap-space-xs overflow-x-auto px-margin py-space-sm">
            {filters.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => {
                  setFilter(f.id)
                  showToast(`Filtrelendi: ${f.label}`, 'filter_list')
                }}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-semibold transition-all duration-200 active:scale-95 ${
                  filter === f.id
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                <Icon name={f.icon} className="text-[16px]" />
                <span>{f.label}</span>
              </button>
            ))}
          </div>

          <div className="mt-space-xs flex flex-col gap-space-md px-margin">
            {/* Event card */}
            <article className="animate-fade-in-2 group flex flex-col overflow-hidden rounded-lg bg-surface-container-lowest shadow-md transition-all duration-300 hover:shadow-lg">
              <div className="relative h-44 w-full overflow-hidden bg-surface-container">
                <img
                  src={EVENT_IMG}
                  alt="Kadıköy TİD Kahvesi"
                  className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/85 via-primary/20 to-transparent" />
                <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-surface-container-lowest/95 px-3 py-1 shadow-sm backdrop-blur-md">
                  <Icon name="local_cafe" className="text-[16px] text-secondary" />
                  <span className="text-[11px] font-bold text-on-surface">Yüz Yüze Buluşma</span>
                </div>
                <div className="absolute right-3 bottom-3 left-3 text-on-primary">
                  <span className="flex items-center gap-1 text-[11px] font-bold tracking-wider text-tertiary-fixed uppercase">
                    <Icon name="event_available" className="text-[14px]" /> Cumartesi 15:00
                  </span>
                  <p className="text-lg leading-snug font-bold drop-shadow-sm">
                    Kadıköy TİD Kahvesi Buluşması
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-space-sm p-space-md">
                <div className="flex items-center gap-1.5 text-on-surface-variant">
                  <Icon name="pin_drop" className="animate-bounce shrink-0 text-[18px] text-primary" />
                  <span className="text-sm font-medium">Moda Sahil Cafe • Kadıköy, İstanbul</span>
                </div>
                <p className="text-sm leading-relaxed text-on-surface">
                  TİD pratiği yapmak isteyen sağır bireyler, tercümanlar ve öğrenciler için samimi
                  çay/kahve buluşması. Her seviyeye açık, sıcak bir öğrenme ortamı!
                </p>
                <div className="flex items-center justify-between gap-space-sm pt-space-xs">
                  <div className="flex items-center">
                    <div className="flex -space-x-2">
                      {AVATARS.map((src) => (
                        <img
                          key={src.slice(-12)}
                          src={src}
                          alt=""
                          className="h-8 w-8 rounded-full object-cover shadow-sm ring-2 ring-surface-container-lowest"
                        />
                      ))}
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-container-high text-[11px] font-bold text-primary shadow-sm ring-2 ring-surface-container-lowest">
                        {joined ? '+16' : '+15'}
                      </div>
                    </div>
                    <span className="ml-2.5 text-[11px] font-medium text-on-surface-variant">
                      {joined ? '19 kişi katılıyor (Sen dahil)' : '18 kişi katılıyor'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={onJoin}
                    className={`relative flex items-center gap-1.5 overflow-hidden rounded-md px-4 py-2.5 text-[13px] font-bold shadow-sm transition-all active:scale-95 ${
                      joined
                        ? 'bg-tertiary-container text-on-tertiary'
                        : 'bg-primary text-on-primary'
                    }`}
                  >
                    <Icon name={joined ? 'task_alt' : 'check_circle'} className="text-[18px]" />
                    <span>{joined ? 'Katıldın ✓' : 'Katılacağım'}</span>
                    {confetti && (
                      <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs font-bold text-tertiary-fixed">
                        ✨ 🎉 ✨
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </article>

            {/* Volunteer card */}
            <article className="animate-fade-in-3 flex flex-col gap-space-sm rounded-lg bg-surface-container-lowest p-space-md shadow-md transition-all duration-300 hover:shadow-lg">
              <div className="flex items-start justify-between gap-space-sm">
                <div className="flex items-center gap-space-sm">
                  <div className="relative">
                    <img
                      src={SELIN_IMG}
                      alt="Selin K."
                      className="h-12 w-12 rounded-full object-cover shadow-sm ring-2 ring-transparent"
                    />
                    <span className="absolute right-0 bottom-0 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-tertiary-fixed-dim text-primary-container shadow-sm">
                      <Icon name="check" className="text-[10px] font-bold" />
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="text-lg font-bold text-on-surface">Selin K.</span>
                      <span className="rounded-full bg-surface-container-low px-2 py-0.5 text-[11px] font-semibold text-primary">
                        Gönüllü
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-on-surface-variant">
                      TİD 1. Seviye Sertifikalı Öğrenci
                    </span>
                  </div>
                </div>
                <span className="badge-pulse flex items-center gap-1 rounded-full bg-secondary-fixed px-2.5 py-1 text-[11px] font-bold text-on-secondary-fixed">
                  <Icon name="handshake" className="text-[14px]" /> Eşleşme
                </span>
              </div>
              <div className="flex flex-col gap-1 rounded-md bg-surface-container-low p-space-sm transition-colors hover:bg-surface-container">
                <span className="flex items-center gap-1 text-[13px] font-bold text-primary">
                  <Icon name="sign_language" className="text-[16px]" />
                  Haftalık Pratik Arkadaşı Aranıyor
                </span>
                <p className="text-sm leading-normal text-on-surface">
                  &quot;Merhaba! Haftada 1 saat online veya Beşiktaş civarında yüz yüze pratik
                  yapabileceğim anadili TİD olan bir yol arkadaşı arıyorum. Karşılığında İngilizce
                  ders desteği sağlayabilirim.&quot;
                </p>
              </div>
              <div className="flex items-center justify-between pt-space-xs">
                <span className="flex items-center gap-1 text-[11px] font-bold text-outline">
                  <Icon name="schedule" className="text-[14px]" /> 2 saat önce paylaşıldı
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (!msgSent) {
                      setMsgSent(true)
                      showToast(
                        "TİD Görüntülü Mesaj Daveti Selin K.'ya iletildi! 💬",
                        'send',
                      )
                    } else {
                      showToast('Mesajlaşma penceresi açılıyor...', 'mark_chat_unread')
                    }
                  }}
                  className={`flex items-center gap-1.5 rounded-md px-4 py-2 text-[13px] font-bold shadow-sm transition-all duration-200 active:scale-95 ${
                    msgSent
                      ? 'bg-tertiary-container text-on-tertiary'
                      : 'bg-surface-container-high text-primary hover:bg-primary hover:text-on-primary'
                  }`}
                >
                  <Icon name="chat" className="text-[18px]" />
                  <span>{msgSent ? 'İstek Gönderildi' : 'Mesaj Gönder'}</span>
                </button>
              </div>
            </article>

            {/* Official announcement */}
            <article className="animate-fade-in-4 relative flex flex-col gap-space-sm overflow-hidden rounded-lg bg-primary-container p-space-md text-on-primary shadow-md transition-all duration-300 hover:shadow-lg">
              <div className="pointer-events-none absolute -right-8 -bottom-8 h-32 w-32 rounded-full bg-primary/40 blur-xl" />
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 rounded-full bg-tertiary-container px-2.5 py-0.5 text-[11px] font-bold text-tertiary-fixed shadow-sm">
                  <Icon name="verified" className="text-[14px]" /> Resmi Duyuru
                </span>
                <span className="text-[11px] font-medium text-on-primary-container">Bugün</span>
              </div>
              <div className="flex items-start gap-space-sm">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-on-primary/10 shadow-inner">
                  <Icon name="directions_boat" className="text-[24px] text-tertiary-fixed" />
                </div>
                <div className="flex flex-col">
                  <h2 className="text-lg leading-snug font-bold text-on-primary">
                    İBB Şehir Hatları Vapurlarında SignBridge Kiosk Başladı
                  </h2>
                  <p className="mt-1 text-sm leading-relaxed text-on-primary-container">
                    Kadıköy, Üsküdar ve Beşiktaş iskelelerindeki danışma kiosklarında canlı TİD
                    çevirisi ve flaşörlü anons sistemi aktif hale getirildi.
                  </p>
                  {guideOpen && (
                    <div className="mt-2 rounded-md border border-on-primary/10 bg-primary/60 p-2.5 text-sm text-on-primary-container">
                      Kiosklar engelli turnikelerinin hemen sağında yer almakta olup, temassız TİD
                      acil çağrı ve iskele bilgilendirme butonları içermektedir.
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between pt-space-xs">
                <button
                  type="button"
                  onClick={() => setGuideOpen((v) => !v)}
                  className="group flex items-center gap-1 py-1 text-[11px] font-bold text-tertiary-fixed"
                >
                  <span>
                    {guideOpen ? 'Kılavuzu Kapat' : 'Detaylı Kılavuzu Görüntüle'}
                  </span>
                  <Icon
                    name="arrow_forward"
                    className={`text-[14px] transition-transform duration-200 group-hover:translate-x-1 ${
                      guideOpen ? 'rotate-90' : ''
                    }`}
                  />
                </button>
                <button
                  type="button"
                  aria-label="Kaydet"
                  onClick={() => {
                    const next = !bookmarked
                    setBookmarked(next)
                    showToast(
                      next
                        ? 'Duyuru kaydedilenlere eklendi.'
                        : 'Duyuru kaydedilenlerden çıkarıldı.',
                      next ? 'bookmark_added' : 'bookmark_remove',
                    )
                  }}
                  className={`flex h-8 w-8 items-center justify-center rounded-full bg-on-primary/10 text-on-primary transition-all hover:bg-on-primary/20 active:scale-90 ${
                    bookmarked ? 'text-secondary-fixed' : ''
                  }`}
                >
                  <Icon
                    name={bookmarked ? 'bookmark' : 'bookmark_border'}
                    className="text-[18px]"
                  />
                </button>
              </div>
            </article>

            {/* Settings */}
            <section className="animate-fade-in-5 mt-space-sm flex flex-col gap-space-sm">
              <div className="flex items-center justify-between px-1">
                <h3 className="flex items-center gap-1.5 text-lg font-bold text-primary">
                  <Icon name="tune" className="text-[20px] text-primary" />
                  Hızlı Donanım ve Profil Ayarları
                </h3>
                <span className="flex items-center gap-1 rounded-full bg-surface-container-low px-2 py-0.5 text-[11px] font-bold text-tertiary-container">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-tertiary-container" />
                  Senkronize
                </span>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-surface-container-lowest p-space-md shadow-sm transition-all hover:shadow-md">
                <div className="flex items-center gap-space-sm">
                  <div className="relative">
                    <img
                      src={ALI_IMG}
                      alt="Ali Yılmaz"
                      className="h-12 w-12 rounded-full object-cover shadow-sm ring-2 ring-primary/20"
                    />
                    <span className="absolute right-0 bottom-0 h-3 w-3 rounded-full bg-tertiary-fixed-dim ring-2 ring-surface-container-lowest" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-lg font-bold text-on-surface">Ali Yılmaz</span>
                    <span className="flex items-center gap-1 text-sm text-on-surface-variant">
                      <Icon name="shield_person" className="text-[16px] text-secondary" />
                      Aile &amp; Güvenlik Planı
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  aria-label="Profili Düzenle"
                  onClick={() =>
                    showToast('Profil ve güvenlik tercihleri düzenleme', 'person')
                  }
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container text-primary transition-all hover:bg-surface-container-high active:scale-90"
                >
                  <Icon name="manage_accounts" className="text-[20px]" />
                </button>
              </div>

              <div className="flex flex-col gap-space-md rounded-lg bg-surface-container-lowest p-space-md shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-space-sm">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-md bg-surface-container-low text-primary ${
                        vibrating ? 'vibrating-icon' : ''
                      }`}
                    >
                      <Icon name="vibration" className="text-[22px]" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[15px] font-bold text-on-surface">
                        Titreşim Şiddeti
                      </span>
                      <span className="text-sm text-on-surface-variant">
                        {vibeLevels[vibeIndex].desc}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onVibe}
                    className="flex items-center gap-1 rounded-full bg-primary px-3.5 py-1.5 text-[11px] font-bold text-on-primary shadow-sm transition-all duration-200 active:scale-95"
                  >
                    <Icon name="bolt" className="text-[16px]" />
                    <span>{vibeLevels[vibeIndex].name}</span>
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-space-sm">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-surface-container-low text-secondary">
                      <Icon name="hearing" className="text-[22px]" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[15px] font-bold text-on-surface">
                        Akustik Radar Bildirimleri
                      </span>
                      <span className="text-sm text-on-surface-variant">
                        {radarOn
                          ? 'Siren, korna ve kapı zili algılama aktif'
                          : 'Bildirimler geçici durduruldu'}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={radarOn}
                    onClick={() => {
                      void radar.toggle()
                      const next = !radarOn
                      showToast(
                        next
                          ? 'Akustik Radar Aktifleştirildi 🔔'
                          : 'Akustik Radar Duraklatıldı',
                        next ? 'hearing' : 'hearing_disabled',
                      )
                    }}
                    className={`relative h-6 w-11 rounded-full shadow-inner transition-colors ${
                      radarOn ? 'bg-tertiary-container' : 'bg-surface-container-highest'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-on-tertiary transition-transform ${
                        radarOn ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-space-sm">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-surface-container-low text-primary">
                      <Icon name="contact_emergency" className="text-[22px]" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[15px] font-bold text-on-surface">
                        Acil Durum Kişileri
                      </span>
                      <span className="text-sm text-on-surface-variant">
                        Tek dokunuş SMS &amp; Konum
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setModalOpen(true)}
                    className="flex items-center gap-1.5 rounded-full bg-surface-container px-3 py-1.5 text-[13px] font-bold text-primary transition-all duration-200 hover:bg-surface-container-high active:scale-95"
                  >
                    <Icon name="group" className="text-[16px]" />
                    <span>3 Kişi</span>
                  </button>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Toast */}
        <div
          className={`fixed bottom-20 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full bg-inverse-surface px-4 py-2.5 text-[13px] font-semibold text-inverse-on-surface shadow-xl transition-all duration-300 ${
            toast
              ? 'pointer-events-auto -translate-y-1.5 opacity-100'
              : 'pointer-events-none opacity-0'
          }`}
        >
          <Icon name={toast?.icon ?? 'check_circle'} className="text-[18px] text-tertiary-fixed-dim" />
          <span>{toast?.msg}</span>
        </div>

        {/* Emergency modal */}
        {modalOpen && (
          <div
            className={`fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm transition-opacity duration-200 ${
              modalVisible ? 'opacity-100' : 'opacity-0'
            }`}
            onClick={(e) => {
              if (e.target === e.currentTarget) closeModal()
            }}
          >
            <div
              className={`flex w-full max-w-md flex-col gap-space-md rounded-t-2xl bg-surface-container-lowest p-margin pb-safe shadow-2xl transition-transform duration-300 ${
                modalVisible ? 'translate-y-0' : 'translate-y-full'
              }`}
            >
              <div className="mx-auto h-1 w-10 rounded-full bg-outline-variant" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon name="contact_emergency" className="text-[22px] text-primary" />
                  <h4 className="text-lg font-bold text-on-surface">
                    Kayıtlı Acil Durum Kişileri
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-container text-on-surface-variant"
                >
                  <Icon name="close" className="text-[20px]" />
                </button>
              </div>
              <div className="flex flex-col gap-2">
                {emergencyContacts.map((c) => (
                  <div
                    key={c.name}
                    className="flex items-center justify-between rounded-md bg-surface-container-low p-2.5"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {c.initial}
                      </span>
                      <div>
                        <p className="text-[13px] font-bold text-on-surface">{c.name}</p>
                        <p className="text-[11px] font-bold text-on-surface-variant">{c.phone}</p>
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                        c.primary
                          ? 'bg-tertiary-fixed/40 text-tertiary-container'
                          : 'bg-surface-container-highest font-semibold text-primary'
                      }`}
                    >
                      {c.priority}
                    </span>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="w-full rounded-md bg-primary py-3 text-[13px] font-bold text-on-primary transition-all active:scale-95"
              >
                Anladım
              </button>
            </div>
          </div>
        )}
      </main>
    </>
  )
}
