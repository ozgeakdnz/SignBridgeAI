import { useEffect, useRef, useState } from 'react'
import { AppHeader } from '../components/layout'
import { Icon } from '../components/Icon'
import {
  predictLiveFrame,
  predictSignVideo,
  resetLiveSession,
  SIGN_API_CONFIGURED,
  SIGN_OFFLINE_MESSAGE,
} from '../lib/signApi'
import { speakTr } from '../lib/speech'

type Tab = 'shadow' | 'chat'

type ChatMsg = {
  id: string
  from: 'anne' | 'me'
  kind: 'voice' | 'tid' | 'text'
  text: string
  at: string
}

const summaries = [
  {
    name: 'Baba (Kemal)',
    nameClass: 'text-primary',
    accent: 'bg-primary-container',
    avatarBg: 'bg-primary-fixed',
    avatar: '👨',
    time: '2 dk önce',
    quote: 'Hafta sonu köye gitmeyi öneriyor.',
    footerIcon: 'verified',
    footerIconClass: 'text-tertiary-container',
    footer: 'Akustik netlik: %98 • Ortak plan teklifi',
  },
  {
    name: 'Anne (Zeynep)',
    nameClass: 'text-secondary',
    accent: 'bg-secondary-container',
    avatarBg: 'bg-secondary-fixed',
    avatar: '👩',
    time: '1 dk önce',
    quote: "Cumartesi günü saat 14:00'e kadar çalışacağını belirtti.",
    footerIcon: 'schedule',
    footerIconClass: 'text-secondary',
    footer: 'Zaman çakışması uyarısı • Plan revizesi gerekebilir',
  },
  {
    name: 'Kardeş (Can)',
    nameClass: 'text-tertiary-container',
    accent: 'bg-tertiary-fixed-dim',
    avatarBg: 'bg-surface-container-high',
    avatar: '👦',
    time: 'Az önce',
    quote: 'Pazar günü sinemaya gitme fikrini destekliyor.',
    footerIcon: 'movie',
    footerIconClass: 'text-tertiary-container',
    footer: 'Alternatif fikir • Aile içi oylama',
  },
] as const

const speakers = [
  {
    name: 'Baba',
    status: 'Konuştu (1dk)',
    icon: 'face_6',
    bg: 'bg-primary-fixed text-primary',
    speaking: true,
  },
  {
    name: 'Anne',
    status: 'Sessiz',
    icon: 'face_3',
    bg: 'bg-secondary-fixed text-on-secondary-fixed',
    speaking: false,
  },
  {
    name: 'Can (Kardeş)',
    status: 'Dinliyor',
    icon: 'face',
    bg: 'bg-surface-container-high text-primary',
    speaking: false,
  },
] as const

const FAMILY_IMG =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuA_ymY1FgVb8TkYy8FyGGDWV1U3vpBVB-26zmBnJh3L94qv6TwZzeoVD10vKv5jS0cpZwGl9tVg-Q1Wkbuk1rNed3gyERNVhYdmg2pUchEcNWuUu-9GU__sgdXeRG748rWR9uWMK0Ohy6Q6wMBYvzkbvlcb6xKNB_j-KDfuvXHEM0pxVroBGbAZd53uxpGiChg9uO-570ealJJECjUHVSn3_ctxyRN7eRPBR8sBHSJ6KHPZnobFTwPQ'
const ANNE_IMG =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuD5MRCrcvqzfNZGce2JbSRgijq_5nUOfjcUCn86nuzGo_hJEC_wY43jwrslD_UBwSCUYpFgslKqun6RnYX0Uf1AXmglXMDKHm5wh42bvfkKI6LxxHOwH8Bssaw4_y2uZ6RuBMlxKXb7-lyaFHgQeNuUBxhUKdYk_r3zgSyKvch9X5xvWYJX0r16wfTYUOqjnQtAMTetRIV4QIPvvy72U_6G-doDxkn_a_9IggU9-SvqU4Et857JIKL3'

const RECORD_MS = 3500

function nowClock() {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const seedMessages: ChatMsg[] = [
  {
    id: 'seed-anne',
    from: 'anne',
    kind: 'voice',
    text: 'Akşam eve gelirken ekmek alabilir misin?',
    at: '17:42',
  },
]

export function YakinlarimPage() {
  const [tab, setTab] = useState<Tab>('shadow')
  const [broadcast, setBroadcast] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMsg[]>(seedMessages)
  const [recording, setRecording] = useState(false)
  const [recStatus, setRecStatus] = useState('')
  const [camError, setCamError] = useState<string | null>(null)
  const [showKeyboard, setShowKeyboard] = useState(false)
  const [typed, setTyped] = useState('')
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!broadcast) return
    const id = window.setTimeout(() => setBroadcast(null), 3500)
    return () => window.clearTimeout(id)
  }, [broadcast])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, recording])

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }, [])

  const announce = (msg: string) => setBroadcast(`"${msg}" masaya duyuruldu!`)

  const pushMine = (text: string, kind: 'tid' | 'text' = 'tid') => {
    setMessages((prev) => [
      ...prev,
      { id: `me-${Date.now()}`, from: 'me', kind, text, at: nowClock() },
    ])
    speakTr(text)
  }

  const stopPreview = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
  }

  const recordTid = async () => {
    if (recording) return
    if (!SIGN_API_CONFIGURED) {
      setCamError(`${SIGN_OFFLINE_MESSAGE} Mesajını klavyeyle yazabilirsin.`)
      return
    }
    setCamError(null)
    setRecording(true)
    setRecStatus('Kamera açılıyor…')

    const sessionId =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `yakin-${Date.now()}`

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      setRecStatus('İşaret yap — canlı tanınıyor…')
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('canvas')

      let bestLabel: string | null = null
      let bestConf = 0
      let offline = false
      const started = performance.now()

      // MediaRecorder/webm OpenCV’de sık “çok kısa” oluyor → kare kare live-frame
      while (performance.now() - started < RECORD_MS) {
        const video = videoRef.current
        if (video && video.readyState >= 2) {
          canvas.width = 480
          canvas.height = 360
          ctx.drawImage(video, 0, 0, 480, 360)
          const blob = await new Promise<Blob | null>((resolve) =>
            canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.75),
          )
          if (blob) {
            const result = await predictLiveFrame(sessionId, blob)
            if (result.offline) {
              offline = true
              break
            }
            if (result.label && (result.confidence ?? 0) > bestConf) {
              bestConf = result.confidence ?? 0
              bestLabel = result.label
            }
            if (result.success && result.label && (result.confidence ?? 0) >= 0.4) {
              bestLabel = result.label
              bestConf = result.confidence ?? bestConf
              break
            }
            const n = result.buffer ?? 0
            setRecStatus(
              result.hands
                ? `İşaret yap… ${Math.min(n, 18)}/18`
                : 'Ellerini göster…',
            )
          }
        }
        await new Promise((r) => window.setTimeout(r, 120))
      }

      stopPreview()
      void resetLiveSession(sessionId)

      if (offline) {
        setCamError(`${SIGN_OFFLINE_MESSAGE} Mesajını klavyeyle yazabilirsin.`)
        setRecStatus('')
      } else if (bestLabel && bestConf >= 0.25) {
        const word = bestLabel.toLocaleUpperCase('tr-TR')
        pushMine(word, 'tid')
        setRecStatus(`Gönderildi: ${word}`)
      } else {
        // Yedek: MediaRecorder (bazı ortamlarda çalışır)
        setRecStatus('Yedek kayıt deneniyor…')
        const stream2 = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
          audio: false,
        })
        streamRef.current = stream2
        if (videoRef.current) {
          videoRef.current.srcObject = stream2
          await videoRef.current.play()
        }
        await new Promise((r) => window.setTimeout(r, 400))
        const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp8')
          ? 'video/webm;codecs=vp8'
          : 'video/webm'
        const chunks: BlobPart[] = []
        const recorder = new MediaRecorder(stream2, { mimeType: mime })
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data)
        }
        const done = new Promise<Blob>((resolve) => {
          recorder.onstop = () => resolve(new Blob(chunks, { type: mime }))
        })
        recorder.start(250)
        await new Promise((r) => window.setTimeout(r, 3200))
        if (recorder.state !== 'inactive') {
          recorder.requestData()
          recorder.stop()
        }
        const blob = await done
        stopPreview()
        if (blob.size < 8000) {
          setRecStatus('Kayıt alınamadı — tekrar dene (MERHABA/EVET)')
        } else {
          const result = await predictSignVideo(blob)
          if (result.success && result.label) {
            const word = result.label.toLocaleUpperCase('tr-TR')
            pushMine(word, 'tid')
            setRecStatus(`Gönderildi: ${word}`)
          } else {
            setRecStatus(result.message || 'İşaret net algılanamadı')
          }
        }
      }
    } catch {
      stopPreview()
      setCamError('Kamera izni gerekli — tarayıcı adres çubuğundan izin ver')
      setRecStatus('')
    } finally {
      setRecording(false)
      window.setTimeout(() => setRecStatus(''), 5000)
    }
  }

  const sendTyped = () => {
    const t = typed.trim()
    if (!t) return
    pushMine(t, 'text')
    setTyped('')
    setShowKeyboard(false)
  }

  const tabClass = (active: boolean) =>
    `flex cursor-pointer items-center justify-center gap-1.5 rounded-md px-2 py-2.5 transition-all duration-200 ${
      active
        ? 'bg-surface-container-lowest text-primary shadow-sm'
        : 'text-on-surface-variant hover:text-primary'
    }`

  return (
    <>
      <AppHeader subtitle="Yakınlarım" />
      <main className="relative flex min-h-dvh w-full flex-col bg-surface pb-24 pt-16">
        <div className="flex w-full flex-col">
          <div className="px-margin pt-space-md pb-space-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-space-xs">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-surface-container-high text-primary">
                  <Icon name="diversity_1" className="text-[20px]" />
                </span>
                <h2 className="text-lg font-semibold text-on-surface">Yakınlarım Çevresi</h2>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-secondary-fixed/50 px-3 py-1 text-on-secondary-fixed">
                <span className="h-2 w-2 animate-ping rounded-full bg-secondary-container" />
                <span className="text-[11px] font-bold">Demo · 1 cihaz</span>
              </div>
            </div>
          </div>

          <div className="my-space-md px-margin">
            <div className="grid grid-cols-2 gap-1 rounded-lg bg-surface-container-high p-1.5 shadow-sm">
              <button
                type="button"
                className={tabClass(tab === 'shadow')}
                onClick={() => setTab('shadow')}
              >
                <Icon name="hearing" className="text-[18px]" />
                <span className="truncate text-[13px] font-semibold">Gölge Dinleyici</span>
              </button>
              <button
                type="button"
                className={tabClass(tab === 'chat')}
                onClick={() => setTab('chat')}
              >
                <Icon name="videocam" className="text-[18px]" />
                <span className="truncate text-[13px] font-semibold">TİD Mesajlaşma</span>
              </button>
            </div>
          </div>

          {tab === 'shadow' ? (
            <div className="flex flex-col gap-space-md px-margin">
              <div className="rounded-md bg-surface-container-low px-3 py-2 text-[12px] text-on-surface-variant">
                <strong className="text-on-surface">Gölge Dinleyici</strong> şu an konsept demo
                (çoklu telefon eşleşme / diarization yok). Çalışan kısım:{' '}
                <strong className="text-on-surface">TİD Mesajlaşma</strong> sekmesi.
              </div>

              <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-primary-container via-primary to-primary p-space-md text-on-primary shadow-md">
                <div className="pointer-events-none absolute -right-6 -bottom-6 h-32 w-32 rounded-full bg-on-primary/5" />
                <div className="relative z-10 flex items-start justify-between">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5">
                      <Icon
                        name="table_restaurant"
                        filled
                        className="text-[20px] text-tertiary-fixed"
                      />
                      <span className="text-[11px] font-bold tracking-wider text-primary-fixed uppercase">
                        Akşam Yemeği Masası
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-on-primary">Masa Dinlemesi (Demo)</h3>
                  </div>
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-container-lowest/15 text-primary-fixed">
                    <Icon name="spatial_audio_off" className="animate-pulse text-[20px]" />
                  </span>
                </div>
                <div className="relative z-10 mt-space-md flex items-center justify-between rounded-md bg-on-primary/10 p-2.5 pt-space-sm">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-tertiary-fixed opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-tertiary-fixed" />
                    </span>
                    <p className="text-sm text-on-primary">
                      Örnek özetler aşağıda — gerçek mikrofon yok
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-space-sm rounded-lg bg-surface-container-lowest p-space-md shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon name="mic_double" className="text-[20px] text-secondary" />
                    <span className="text-[13px] font-semibold text-on-surface">
                      Masadaki Akustik Dağılım
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-outline">Demo</span>
                </div>
                <div className="flex items-center justify-around py-space-sm">
                  {speakers.map((s) => (
                    <div key={s.name} className="flex flex-col items-center gap-1">
                      <div className="relative flex items-center justify-center">
                        <span
                          className={`flex h-12 w-12 items-center justify-center rounded-full font-bold shadow-sm ${s.bg}`}
                        >
                          <Icon name={s.icon} className="text-[26px]" />
                        </span>
                        {s.speaking && (
                          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-tertiary-fixed-dim">
                            <Icon
                              name="volume_up"
                              className="text-[12px] font-bold text-on-tertiary-fixed"
                            />
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-semibold text-on-surface">{s.name}</span>
                      <span className="text-[10px] leading-tight text-on-surface-variant">
                        {s.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-space-sm">
                <div className="flex items-center gap-2 px-1">
                  <Icon name="auto_awesome" className="text-[18px] text-primary" />
                  <span className="text-[13px] font-bold text-on-surface">AI Hap Özetler (örnek)</span>
                </div>
                {summaries.map((s) => (
                  <div
                    key={s.name}
                    className="overflow-hidden rounded-lg bg-surface-container-lowest shadow-sm"
                  >
                    <div className={`h-1 w-full ${s.accent}`} />
                    <div className="flex gap-3 p-space-md">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg ${s.avatarBg}`}
                      >
                        {s.avatar}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-[13px] font-bold ${s.nameClass}`}>{s.name}</span>
                          <span className="text-[11px] text-outline">{s.time}</span>
                        </div>
                        <p className="mt-1 text-sm text-on-surface">&quot;{s.quote}&quot;</p>
                        <div className="mt-2 flex items-center gap-1 text-[11px] text-on-surface-variant">
                          <Icon name={s.footerIcon} className={`text-[14px] ${s.footerIconClass}`} />
                          <span>{s.footer}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-2 rounded-lg bg-surface-container-lowest p-space-md shadow-sm">
                <span className="text-[12px] font-bold text-on-surface">Masaya hızlı yanıt (yerel)</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => announce('Ben de pazar günü gelirim!')}
                    className="rounded-full bg-primary-container px-3 py-2 text-[12px] font-semibold text-on-primary active:scale-95"
                  >
                    Ben de pazar günü gelirim!
                  </button>
                  <button
                    type="button"
                    onClick={() => announce('Harika bir fikir!')}
                    className="rounded-full bg-surface-container-high px-3 py-2 text-[12px] font-semibold text-on-surface active:scale-95"
                  >
                    Harika bir fikir!
                  </button>
                  <button
                    type="button"
                    onClick={() => announce('Cumartesiye ne dersiniz?')}
                    className="rounded-full bg-surface-container-high px-3 py-2 text-[12px] font-semibold text-on-surface active:scale-95"
                  >
                    Cumartesiye ne dersiniz?
                  </button>
                </div>
                {broadcast && (
                  <div className="mt-1 flex items-center justify-between rounded-md bg-tertiary-container px-3 py-2 text-on-tertiary-container">
                    <div className="flex items-center gap-2">
                      <Icon name="volume_up" className="text-[18px]" />
                      <span className="text-sm font-semibold">{broadcast}</span>
                    </div>
                    <span className="rounded-full bg-on-tertiary/20 px-2 py-0.5 text-[11px] font-bold">
                      Yayınlandı
                    </span>
                  </div>
                )}
              </div>

              <div className="relative mt-space-xs h-32 w-full overflow-hidden rounded-lg shadow-sm">
                <img src={FAMILY_IMG} alt="Aile sofrası" className="h-full w-full object-cover" />
                <div className="absolute inset-0 flex items-end bg-gradient-to-t from-primary-container/85 via-primary-container/30 to-transparent p-space-md">
                  <p className="text-[11px] font-medium text-on-primary">
                    Aile Sofrası • Gerçek cihaz eşleşmesi sonraki sürümde.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-space-md px-margin pb-4">
              <div className="flex items-center justify-between rounded-lg bg-surface-container-lowest p-space-md shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="h-12 w-12 overflow-hidden rounded-full shadow-sm">
                      <img src={ANNE_IMG} alt="Anne Zeynep" className="h-full w-full object-cover" />
                    </div>
                    <span className="absolute right-0 bottom-0 h-3.5 w-3.5 rounded-full bg-tertiary-fixed-dim ring-2 ring-surface-container-lowest" />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-lg font-bold text-on-surface">Anne (Zeynep)</h3>
                      <Icon name="family_restroom" filled className="text-[18px] text-primary" />
                    </div>
                    <span className="text-[11px] font-bold text-tertiary-container">
                      Gerçek TİD tanıma bağlı · backend açık olmalı
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-md bg-surface-container-low px-3 p-space-sm">
                <Icon name="sync_alt" className="text-[18px] text-primary-container" />
                <p className="text-[11px] leading-tight text-on-surface-variant">
                  Bu sekme <strong className="text-on-surface">ortam sohbetini yazmaz</strong>.
                  Senin TİD işaretini metne çevirip anneye iletir (demo). Ortam konuşması =
                  henüz yok.
                </p>
              </div>

              {messages.map((m) =>
                m.from === 'anne' ? (
                  <div key={m.id} className="flex max-w-[90%] flex-col gap-1.5 self-start">
                    <div className="flex items-center gap-1 px-1">
                      <span className="text-[11px] font-semibold text-secondary">Anne</span>
                      <span className="text-[11px] font-bold text-on-surface-variant">{m.at}</span>
                    </div>
                    <div className="flex flex-col gap-2.5 rounded-lg rounded-tl-none bg-surface-container-lowest p-space-md shadow-sm">
                      <div className="flex items-center gap-2.5 rounded-md bg-surface-container-high/60 p-2">
                        <button
                          type="button"
                          onClick={() => speakTr(m.text)}
                          className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full bg-secondary-container text-on-secondary-container shadow-sm active:scale-95"
                        >
                          <Icon name="play_arrow" className="text-[18px]" />
                        </button>
                        <div className="min-w-0 flex-1">
                          <span className="text-[11px] font-bold text-on-surface">Sesli mesaj</span>
                          <p className="text-sm text-on-surface-variant">Play ile dinle</p>
                        </div>
                      </div>
                      <div className="rounded-md bg-surface-container-low p-2.5">
                        <span className="flex items-center gap-1 text-[11px] font-bold text-tertiary-container">
                          <Icon name="sign_language" className="text-[16px]" />
                          Metin özeti
                        </span>
                        <p className="mt-1 text-base font-semibold text-on-surface">
                          &quot;{m.text}&quot;
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div key={m.id} className="flex max-w-[92%] flex-col gap-1.5 self-end">
                    <div className="flex items-center justify-end gap-1 px-1">
                      <span className="text-[11px] font-bold text-on-surface-variant">{m.at}</span>
                      <span className="text-[11px] font-semibold text-primary">
                        Sen ({m.kind === 'tid' ? 'TİD' : 'Yazı'})
                      </span>
                    </div>
                    <div className="rounded-lg rounded-tr-none bg-primary-container p-space-md text-on-primary shadow-md">
                      <div className="rounded-md bg-surface-container-lowest p-2.5 text-on-surface">
                        <span className="flex items-center gap-1 text-[11px] font-bold text-on-surface-variant">
                          <Icon name="record_voice_over" className="text-[15px] text-primary" />
                          Anneye giden metin + ses
                        </span>
                        <p className="mt-1 text-sm font-bold text-primary-container">
                          &quot;{m.text}&quot;
                        </p>
                      </div>
                    </div>
                  </div>
                ),
              )}
              <div ref={chatEndRef} />

              {(recording || recStatus || camError) && (
                <div className="overflow-hidden rounded-lg bg-black shadow-md">
                  <video
                    ref={videoRef}
                    muted
                    playsInline
                    autoPlay
                    className={`aspect-[4/3] w-full object-cover ${recording ? 'opacity-100' : 'hidden'}`}
                    style={{ transform: 'scaleX(-1)' }}
                  />
                  <p className="px-3 py-2 text-center text-[12px] font-semibold text-white">
                    {camError || recStatus}
                  </p>
                </div>
              )}

              {showKeyboard && (
                <div className="flex gap-2 rounded-lg bg-surface-container-lowest p-2 shadow-sm">
                  <input
                    value={typed}
                    onChange={(e) => setTyped(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendTyped()}
                    placeholder="Anneye yaz…"
                    className="h-11 flex-1 rounded-md bg-surface-container-low px-3 text-sm outline-none ring-primary focus:ring-2"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={sendTyped}
                    className="rounded-md bg-primary px-4 text-[13px] font-bold text-on-primary"
                  >
                    Gönder
                  </button>
                </div>
              )}

              <div className="mt-space-xs flex flex-col gap-3 rounded-lg bg-surface-container-lowest p-space-md shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[13px] font-bold text-on-surface">
                    <Icon name="videocam" className="text-[20px] text-primary" />
                    Hızlı TİD Videosu Gönder
                  </span>
                  <span className="text-[11px] font-semibold text-tertiary-container">
                    {recording ? 'Kayıt…' : 'Hazır'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={recording}
                    onClick={() => void recordTid()}
                    className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 text-[13px] font-bold text-on-primary shadow-md transition-transform active:scale-[0.98] disabled:opacity-60"
                  >
                    <Icon
                      name={recording ? 'progress_activity' : 'video_camera_front'}
                      className={`text-[20px] ${recording ? 'animate-spin' : ''}`}
                    />
                    {recording ? 'Kaydediliyor…' : 'Bas & TİD Kaydet (~3 sn)'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowKeyboard((v) => !v)}
                    className="flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-md bg-surface-container-high text-primary shadow-sm transition-colors hover:bg-surface-container-highest active:scale-95"
                    aria-label="Klavye"
                  >
                    <Icon name="keyboard" className="text-[22px]" />
                  </button>
                </div>
                <p className="text-center text-[11px] font-bold text-on-surface-variant">
                  MERHABA / EVET dene · API: 127.0.0.1:8000
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  )
}
