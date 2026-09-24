import { useEffect, useRef, useState } from 'react'
import { AppHeader } from '../components/layout'
import { Icon } from '../components/Icon'
import { useRadar } from '../lib/radar/RadarProvider'
import {
  predictLiveFrame,
  resetLiveSession,
  SIGN_API_CONFIGURED,
  SIGN_OFFLINE_MESSAGE,
} from '../lib/signApi'
import { speakTr, useLiveCaptions } from '../lib/speech'

type Mode = 'cift-yonlu' | 'tid-kamerasi' | 'yaz-konus'
type SpeakState = 'idle' | 'sending' | 'done'

const AVATAR_IMG =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAAH2pfCckbMJ0EDGrRUQHuDUGjPIhqWLJNjltqKF7MN82XpF7NCKQeDLwbSMJmEkQ6nM9Z4Q-Rh4pnjLOUdCYgkUeCXymE3USWEqQGmw_LrUMyKTuxsnfXNA5ONPB9zJcN3jjp-oeI03SnPXIm0BeM4F-wlUmDbQ_rdVqRbXGN3th-8bIn9ZJ5zR4h-jRNpfHPJt3VFzHPDZymECS-qFDTR0KezPdmtjbeLXak1oCVxh1a3QPaXFc6'
const CAMERA_IMG =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAg0NGMKm1NYveveWY-lb9Bt6_nzaXH97Xnkwvp8S_YT1fN4Q56mdI1yZ8-N_cBjm0ZiaQss5Kx4YITxwEiLKuuti_L52HUdhHElYF-Hul3M3CiVwh4Qa0Q-yJxm87bQGSvfXC54f3R9GX93fvJbMuR3yU1h2dJOggPMbBWyOhqlWbz-pw78F0VkfZ4VkrXoSjnITEZmDCwFKWYICb3Zs0ipFkzxrrPu0nIZ9geTsUUHJlFlb97EIHK'

const modes: { id: Mode; label: string; icon: string }[] = [
  { id: 'cift-yonlu', label: 'Çift Yönlü', icon: 'sync_alt' },
  { id: 'tid-kamerasi', label: 'TİD Kamerası', icon: 'videocam' },
  { id: 'yaz-konus', label: 'Yaz-Konuş', icon: 'keyboard' },
]

const quickPhrases = [
  'Form doldurmam gerekiyor mu?',
  'Reçetemi alabilir miyim?',
  'Anlamadım, tekrar eder misiniz?',
]

/** Kısa TİD hatırlatıcıları — MEB TİD Sözlüğü / yaygın kullanım; resmi video için tidsozluk.aile.gov.tr */
const SIGN_GUIDE: { word: string; how: string; tip?: string }[] = [
  {
    word: 'MERHABA',
    how: 'Sağ el düz, parmaklar bitişik; elin kenarını veya parmak uçlarını alına / şakağa değdir (selam).',
    tip: 'En iyi deneneceklerden',
  },
  {
    word: 'NASILSIN',
    how: 'Parmak uçlarını birleştirip göğüs hizasında hafifçe öne doğru soru hareketi yap; mimik soru gibi olsun.',
  },
  {
    word: 'IYI',
    how: 'Başparmak yukarı (beğenme/iyi); göğüs önünde net tut.',
  },
  {
    word: 'TESEKKUR',
    how: 'Açık elin parmak uçlarını çene / ağız hizasına değdir, sonra karşıya doğru öne uzat.',
  },
  {
    word: 'EVET',
    how: 'Yumruk yap; bilekten aşağı-yukarı “kafa sallar gibi” iki-üç kez hareket ettir.',
    tip: 'En iyi deneneceklerden',
  },
  {
    word: 'TAMAM',
    how: 'Başparmak açık, diğer parmaklar kapalı; eli öne doğru “tamam” diye uzat.',
  },
  {
    word: 'YARDIM',
    how: 'Bir el yumruk, diğer açık el yumruğu alttan destekler / kaldırır gibi öne verir.',
  },
  {
    word: 'DOKTOR',
    how: 'İşaret parmağıyla bilekte nabız alır gibi iki kez dokun (veya üst kola “+” işareti).',
  },
  {
    word: 'HEMSIRE',
    how: 'Üst kola / omza haç (+) benzeri dokunuş; hemşire şapkası düşün.',
  },
  {
    word: 'ALERJI',
    how: 'Burun / yanak çevresinde kaşınma veya rahatsızlık jesti; yüz ifadesi önemli.',
  },
  {
    word: 'ANNE',
    how: 'Açık kıvrık parmak uçlarını sol göğse, sonra sağ göğse koy (MEB).',
  },
  {
    word: 'BABA',
    how: 'Başparmak açık, diğerleri kapalı; başparmağı çeneye değdir (MEB).',
  },
  {
    word: 'TUVALET',
    how: 'T el biçimi (işaret parmağı öne, başparmak bitişik) veya yaygın tuvalet işaretini göğüs önünde yap.',
  },
  {
    word: 'NEREDE',
    how: 'Avuçlar yukarı / işaret parmakları “nerede?” diye hafif sallama; omuz silkme + soru mimik.',
  },
  {
    word: 'NE',
    how: 'İşaret parmağı açık; “ne?” diye bilekten hafif salla, kaşlar kalkık.',
  },
  {
    word: 'SEN',
    how: 'İşaret parmağıyla kameraya / karşıya doğru net işaret et.',
  },
  {
    word: 'BEN',
    how: 'Açık avuç veya işaret parmağıyla göğsüne dokun (ben).',
  },
  {
    word: 'HOSCA KAL',
    how: 'Açık eliyle “güle güle” salla (veda dalgası).',
  },
  {
    word: 'DIKKAT',
    how: 'İşaret parmağını yukarı kaldır veya elini göz hizasına getirip uyarı jesti yap.',
  },
  {
    word: 'SU',
    how: 'Yumruk + açık başparmak; başparmağı ağza götür (içme / su) — MEB.',
    tip: 'Modelde şu an zayıf',
  },
]

function stopStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((t) => t.stop())
}

function cameraErrorMessage(err: unknown): string {
  const name = err instanceof DOMException ? err.name : ''
  if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
    return 'Kamera izni reddedildi — tarayıcı adres çubuğundan izin ver'
  }
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
    return 'Kamera bulunamadı'
  }
  if (name === 'NotReadableError' || name === 'TrackStartError') {
    return 'Kamera başka uygulamada açık olabilir'
  }
  if (!window.isSecureContext) {
    return 'Kamera için localhost veya HTTPS gerekli'
  }
  return 'Kamera açılamadı'
}

export function KopruPage() {
  const [mode, setMode] = useState<Mode>('cift-yonlu')
  const [zoomed, setZoomed] = useState(false)
  const [ttsPlaying, setTtsPlaying] = useState(false)
  const [reply, setReply] = useState('Teşekkür ederim, kaçıncı oda?')
  const [detected, setDetected] = useState('“Kamerayı aç — işaret yaptıkça canlı yazılır”')
  const [speakState, setSpeakState] = useState<SpeakState>('idle')
  const [flipDeg, setFlipDeg] = useState(0)
  const [chipFlash, setChipFlash] = useState<string | null>(null)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user')
  const [cameraOn, setCameraOn] = useState(false)
  const [cameraBusy, setCameraBusy] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [recognizing, setRecognizing] = useState(false)
  const [liveConf, setLiveConf] = useState(0)
  const [guideOpen, setGuideOpen] = useState(false)
  const [signOffline, setSignOffline] = useState(!SIGN_API_CONFIGURED)
  const captions = useLiveCaptions()
  const { status: radarStatus, start: startRadar, stop: stopRadar } = useRadar()
  const radarPausedRef = useRef(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const sessionIdRef = useRef(
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `s-${Date.now()}`,
  )
  const smoothRef = useRef({ label: '', count: 0 })
  const wantCameraRef = useRef(true)

  const attachStreamToVideo = async (stream: MediaStream) => {
    const video = videoRef.current
    if (!video) return
    if (video.srcObject !== stream) {
      video.srcObject = stream
    }
    video.muted = true
    video.playsInline = true
    try {
      await video.play()
    } catch {
      // Autoplay bazen kullanıcı jesti ister; tıklamada tekrar denenecek
    }
  }

  const startCamera = async (facing: 'user' | 'environment' = facingMode) => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraOn(false)
      setCameraError('Bu tarayıcı kamerayı desteklemiyor')
      return
    }
    setCameraBusy(true)
    setCameraError(null)
    wantCameraRef.current = true
    try {
      stopStream(streamRef.current)
      streamRef.current = null
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facing },
          // Üst gövde + eller için dikey/kareye yakın tercih
          width: { ideal: 720 },
          height: { ideal: 960 },
          aspectRatio: { ideal: 0.75 },
        },
        audio: false,
      })
      if (!wantCameraRef.current) {
        stopStream(stream)
        return
      }
      streamRef.current = stream
      setCameraOn(true)
      // Video DOM’u state güncellemesinden sonra hazır olsun
      requestAnimationFrame(() => {
        void attachStreamToVideo(stream)
      })
      await attachStreamToVideo(stream)
    } catch (err) {
      stopStream(streamRef.current)
      streamRef.current = null
      setCameraOn(false)
      setCameraError(cameraErrorMessage(err))
    } finally {
      setCameraBusy(false)
    }
  }

  const stopCamera = () => {
    wantCameraRef.current = false
    stopStream(streamRef.current)
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    void resetLiveSession(sessionIdRef.current)
    sessionIdRef.current =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `s-${Date.now()}`
    smoothRef.current = { label: '', count: 0 }
    setCameraOn(false)
    setCameraError(null)
    setRecognizing(false)
    setLiveConf(0)
    setDetected('“Kamerayı aç — işaret yaptıkça canlı yazılır”')
  }

  // Kamerayı otomatik açma — kullanıcı "Kamerayı Aç"a basınca başlar (izin için tıklama şart)
  useEffect(() => {
    if (!cameraOn) return
    void startCamera(facingMode)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode])

  useEffect(() => {
    return () => {
      wantCameraRef.current = false
      stopStream(streamRef.current)
      streamRef.current = null
      if (videoRef.current) videoRef.current.srcObject = null
      void resetLiveSession(sessionIdRef.current)
    }
  }, [])

  useEffect(() => {
    if (cameraOn && streamRef.current) {
      void attachStreamToVideo(streamRef.current)
    }
  }, [cameraOn])

  // Canlı tanıma: kare kare JPEG → backend MediaPipe + 30'luk tampon (video kaydı yok)
  useEffect(() => {
    if (!cameraOn) return
    if (!SIGN_API_CONFIGURED) {
      setDetected('“Tanıma sunucusu kapalı”')
      return
    }

    let cancelled = false
    let inFlight = false
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    const tick = async () => {
      if (cancelled || inFlight || !ctx) return
      const video = videoRef.current
      if (!video || video.readyState < 2) return

      const w = 480
      const h = 360
      canvas.width = w
      canvas.height = h
      // Ayna YOK — model ham kamera yönü (veri seti ile aynı)
      ctx.drawImage(video, 0, 0, w, h)

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.72),
      )
      if (!blob || cancelled) return

      inFlight = true
      setRecognizing(true)
      try {
        const result = await predictLiveFrame(sessionIdRef.current, blob)
        if (cancelled) return

        if (result.offline) {
          cancelled = true
          window.clearInterval(id)
          setRecognizing(false)
          setSignOffline(true)
          setDetected('“Tanıma sunucusu kapalı”')
          return
        }

        setLiveConf(result.confidence || 0)

        if (!result.hands && (result.buffer ?? 0) === 0) {
          setDetected('“Ellerini göster”')
          smoothRef.current = { label: '', count: 0 }
          return
        }

        if (!result.ready) {
          const n = result.buffer ?? 0
          const need = 18
          setDetected(`“Takip… ${Math.min(n, need)}/${need}”`)
          return
        }

        if (result.ready && !result.candidate && !result.label) {
          setDetected('“Hareketli işaret yap (MERHABA / EVET)”')
          return
        }

        // Sadece net tahminleri yaz
        if (!result.success || !result.label) {
          const hint = result.candidate
          setDetected(
            hint
              ? `“Devam et… (${hint.toLocaleUpperCase('tr-TR')})”`
              : '“İşareti tekrarla”',
          )
          return
        }

        const word = result.label.trim().toLocaleUpperCase('tr-TR')
        if (word === smoothRef.current.label) {
          smoothRef.current.count += 1
        } else {
          smoothRef.current = { label: word, count: 1 }
        }

        if (smoothRef.current.count >= 2 || (result.confidence ?? 0) >= 0.6) {
          setDetected(`“${word}”`)
          setReply(word)
        } else {
          setDetected(`“${word}…?”`)
        }
      } finally {
        inFlight = false
        if (!cancelled) setRecognizing(false)
      }
    }

    const id = window.setInterval(() => {
      void tick()
    }, 90)

    return () => {
      cancelled = true
      window.clearInterval(id)
      setRecognizing(false)
    }
  }, [cameraOn])

  // Radar ve altyazı aynı mikrofonu paylaşamıyor (özellikle iOS); altyazı süresince radar duraklar
  const toggleCaptions = () => {
    if (captions.listening) {
      captions.stop()
      return
    }
    if (radarStatus === 'listening' || radarStatus === 'starting') {
      radarPausedRef.current = true
      stopRadar()
    }
    if (!captions.start() && radarPausedRef.current) {
      radarPausedRef.current = false
      void startRadar()
    }
  }

  useEffect(() => {
    if (captions.listening || !radarPausedRef.current) return
    radarPausedRef.current = false
    void startRadar()
  }, [captions.listening, startRadar])

  const captionText = [...captions.lines, captions.interim].filter(Boolean).join(' ')

  const onListen = () => {
    if (ttsPlaying || !captionText) return
    // Kendi seslendirmemizi altyazıya yazmasın
    if (captions.listening) captions.stop()
    if (speakTr(captionText, () => setTtsPlaying(false))) setTtsPlaying(true)
  }

  const onChip = (text: string) => {
    setReply(text)
    setDetected(`“${text}”`)
    setChipFlash(text)
    window.setTimeout(() => setChipFlash(null), 350)
  }

  const onSpeak = () => {
    if (speakState !== 'idle') return
    setSpeakState('sending')
    const finish = () => {
      setSpeakState('done')
      window.setTimeout(() => setSpeakState('idle'), 1500)
    }
    if (captions.listening) captions.stop()
    if (!speakTr(reply, finish)) window.setTimeout(finish, 1800)
  }

  return (
    <>
      <AppHeader subtitle="Köprü Çeviri" />
      <main className="relative flex min-h-dvh w-full flex-col bg-surface pb-24 pt-16">
        <div className="flex w-full flex-col gap-space-md px-margin pb-space-lg">
          {/* Mode tabs */}
          <div className="relative flex w-full select-none items-center justify-between rounded-lg bg-surface-container-low p-1 shadow-sm">
            {modes.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMode(m.id)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-1 py-2 text-center text-[13px] font-semibold transition-all duration-200 active:scale-95 ${
                  mode === m.id
                    ? 'bg-surface-container-lowest text-primary shadow-sm'
                    : 'text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                <Icon name={m.icon} className="text-[18px]" />
                <span className="truncate">{m.label}</span>
              </button>
            ))}
          </div>

          {/* Context chip */}
          <div className="flex w-full items-center justify-between rounded-lg bg-surface-container-high p-3 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
                <Icon name="local_hospital" className="relative z-10 text-[18px]" />
                <span className="absolute inset-0 animate-ping rounded-full bg-secondary-fixed-dim/40 opacity-60" />
              </div>
              <div className="flex min-w-0 flex-col">
                <span className="text-[11px] font-bold tracking-wider text-secondary uppercase">
                  Otomatik Algılandı
                </span>
                <span className="truncate text-lg font-semibold text-on-surface">
                  Hastane / Banka Modu Aktif
                </span>
              </div>
            </div>
            <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-surface-container-lowest px-2.5 py-1 text-[11px] font-bold text-tertiary">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-on-tertiary-container opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-on-tertiary-container" />
              </span>
              Akustik Net
            </span>
          </div>

          {/* Karşı taraf */}
          <div className="relative flex w-full flex-col gap-space-sm overflow-hidden rounded-lg bg-surface-container-lowest p-space-md shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon name="record_voice_over" className="text-[20px] text-primary" />
                <span className="text-lg font-semibold text-primary">Karşı Taraf Konuşuyor</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-surface-container-low px-2.5 py-1 text-[11px] text-on-surface-variant">
                <div className="flex h-3.5 w-3.5 items-end justify-center gap-0.5">
                  <span className="eq-bar-1 inline-block w-[2px] rounded-full bg-tertiary-container" />
                  <span className="eq-bar-2 inline-block w-[2px] rounded-full bg-tertiary-container" />
                  <span className="eq-bar-3 inline-block w-[2px] rounded-full bg-tertiary-container" />
                  <span className="eq-bar-4 inline-block w-[2px] rounded-full bg-tertiary-container" />
                </div>
                <span className="font-semibold text-primary">Canlı Altyazı</span>
              </div>
            </div>

            <div
              className={`relative flex min-h-[90px] flex-col justify-center gap-2 overflow-hidden rounded-md p-space-md transition-all duration-300 ${
                zoomed
                  ? 'border border-primary/20 bg-primary-fixed/40'
                  : 'bg-surface-container-low'
              }`}
            >
              {captionText ? (
                <p
                  aria-live="polite"
                  className={`font-medium leading-relaxed transition-all duration-200 ${
                    zoomed
                      ? 'text-[26px] leading-[34px] font-bold tracking-tight text-primary'
                      : 'text-lg text-on-surface'
                  }`}
                >
                  {captions.lines.join(' ')}
                  {captions.interim && (
                    <span className="opacity-60">
                      {captions.lines.length ? ' ' : ''}
                      {captions.interim}
                    </span>
                  )}
                </p>
              ) : (
                <p className="text-[15px] leading-relaxed text-on-surface-variant">
                  {!captions.supported
                    ? 'Bu tarayıcı canlı altyazıyı desteklemiyor. Chrome veya Safari ile aç.'
                    : captions.listening
                      ? 'Dinleniyor… Karşındaki kişi konuştukça burada yazıya dökülecek.'
                      : 'Altyazıyı başlat: karşındaki kişinin konuşması anında yazıya dökülür.'}
                </p>
              )}
              <div className="flex items-center gap-1.5 text-on-surface-variant">
                <span className="relative flex h-2 w-2">
                  {captions.listening && (
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-tertiary-container opacity-60" />
                  )}
                  <span
                    className={`relative inline-flex h-2 w-2 rounded-full ${
                      captions.listening ? 'bg-tertiary-container' : 'bg-outline'
                    }`}
                  />
                </span>
                <span className="text-[11px] font-bold">
                  {captions.listening
                    ? 'Dinleniyor • Mikrofon açık'
                    : captionText
                      ? 'Duraklatıldı'
                      : 'Altyazı kapalı'}
                </span>
              </div>
              {captions.error && (
                <p className="rounded-md bg-error-container/30 px-3 py-2 text-[12px] font-semibold text-on-surface">
                  {captions.error}
                </p>
              )}
              {ttsPlaying && (
                <div className="mt-1 flex items-center gap-2 rounded-md bg-primary-fixed px-2.5 py-1 text-xs font-semibold text-primary">
                  <Icon name="volume_up" className="animate-bounce text-[16px]" />
                  <span>Metin seslendiriliyor...</span>
                </div>
              )}
            </div>

            <div className="group relative flex w-full items-center gap-3 overflow-hidden rounded-md bg-surface-container p-space-sm">
              <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md border border-primary-fixed/40 bg-surface-container-highest">
                <img
                  src={AVATAR_IMG}
                  alt="TİD avatar"
                  className="avatar-anim h-full w-full object-cover"
                />
                <div className="absolute right-1 bottom-1 flex h-3 w-3 items-center justify-center">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-tertiary-fixed-dim opacity-80" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full border border-surface-container-lowest bg-tertiary-container" />
                </div>
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-tertiary-container">
                    <Icon name="sign_language" className="text-[16px]" />
                    <span className="text-[13px] font-bold">TİD Çevirisi Oynatılıyor</span>
                  </div>
                  <div className="flex items-center gap-1 rounded bg-primary-fixed/60 px-1.5 py-0.5 text-[11px] font-bold text-primary">
                    <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                    <span>CANLI</span>
                  </div>
                </div>
                <p className="mt-0.5 truncate font-mono text-sm tracking-tight text-on-surface-variant">
                  [MERHABA] [KAYIT] [TAMAM] [DOKTOR] [BEKLE]
                </p>
                <span className="mt-0.5 flex items-center gap-1 text-[11px] font-bold text-outline">
                  <Icon name="smart_toy" className="text-[13px] text-tertiary" />
                  3D Gerçek Zamanlı Sentez
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={toggleCaptions}
                disabled={!captions.supported}
                className={`mr-auto flex h-10 cursor-pointer items-center gap-1.5 rounded-md px-3.5 text-[13px] font-bold shadow-sm transition-all duration-150 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 ${
                  captions.listening
                    ? 'bg-error-container text-on-error-container'
                    : 'bg-primary-container text-on-primary'
                }`}
              >
                <Icon name={captions.listening ? 'mic_off' : 'mic'} className="text-[18px]" />
                <span>{captions.listening ? 'Altyazıyı Durdur' : 'Altyazıyı Başlat'}</span>
              </button>
              {captionText && !captions.listening && (
                <button
                  type="button"
                  onClick={captions.clear}
                  className="flex h-10 cursor-pointer items-center gap-1.5 rounded-md bg-surface-container-low px-3 text-[13px] font-semibold text-primary transition-all duration-150 hover:bg-surface-container active:scale-95"
                >
                  <Icon name="backspace" className="text-[18px]" />
                  <span>Temizle</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setZoomed((v) => !v)}
                className="flex h-10 cursor-pointer items-center gap-1.5 rounded-md bg-surface-container-low px-3.5 text-[13px] font-semibold text-primary transition-all duration-150 hover:bg-surface-container active:scale-95"
              >
                <Icon name="format_size" className="text-[18px]" />
                <span>{zoomed ? 'Normale Döndür' : 'Metni Büyüt'}</span>
              </button>
              <button
                type="button"
                onClick={onListen}
                disabled={!captionText}
                className="flex h-10 cursor-pointer items-center gap-1.5 rounded-md bg-surface-container-low px-3.5 text-[13px] font-semibold text-primary transition-all duration-150 hover:bg-surface-container active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Icon
                  name={ttsPlaying ? 'graphic_eq' : 'volume_up'}
                  className={`text-[18px] ${ttsPlaying ? 'animate-spin' : ''}`}
                />
                <span>{ttsPlaying ? 'Oynatılıyor...' : 'Sesli Dinle'}</span>
              </button>
            </div>
          </div>

          {/* Senin cevabın */}
          <div className="flex w-full flex-col gap-space-sm rounded-lg bg-surface-container-lowest p-space-md shadow-md">
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <Icon name="waving_hand" className="text-[20px] text-primary-container" />
                <span className="text-lg font-semibold text-on-surface">Senin Cevabın</span>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="flex items-center gap-1.5 rounded-full bg-surface-container px-2 py-0.5 text-[11px] font-bold text-on-surface-variant">
                  <span className="relative flex h-2 w-2">
                    <span
                      className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${cameraOn ? 'bg-primary' : 'bg-outline'}`}
                    />
                    <span
                      className={`relative inline-flex h-2 w-2 rounded-full ${cameraOn ? 'bg-primary' : 'bg-outline'}`}
                    />
                  </span>
                  {cameraBusy
                    ? 'Açılıyor…'
                    : cameraError
                      ? 'İzin / Hata'
                      : cameraOn
                        ? recognizing
                          ? 'Tanınıyor…'
                          : 'Kamera Açık'
                        : 'Kamera Kapalı'}
                </span>
                {cameraOn ? (
                  <>
                    <button
                      type="button"
                      onClick={() => void startCamera()}
                      disabled={cameraBusy}
                      className="flex h-9 cursor-pointer items-center gap-1.5 rounded-md bg-surface-container-high px-3 text-[13px] font-bold text-primary shadow-sm transition-all active:scale-95 disabled:opacity-60"
                    >
                      <Icon name="refresh" className="text-[18px]" />
                      Yenile
                    </button>
                    <button
                      type="button"
                      onClick={stopCamera}
                      disabled={cameraBusy}
                      className="flex h-9 cursor-pointer items-center gap-1.5 rounded-md bg-error-container px-3 text-[13px] font-bold text-on-error-container shadow-sm transition-all active:scale-95 disabled:opacity-60"
                    >
                      <Icon name="videocam_off" className="text-[18px]" />
                      Kapat
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => void startCamera()}
                    disabled={cameraBusy}
                    className="flex h-9 cursor-pointer items-center gap-1.5 rounded-md bg-primary-container px-3 text-[13px] font-bold text-on-primary shadow-sm transition-all active:scale-95 disabled:opacity-60"
                  >
                    <Icon name="videocam" className="text-[18px]" />
                    {cameraBusy ? 'Açılıyor…' : 'Kamerayı Aç'}
                  </button>
                )}
              </div>
            </div>

            {cameraError && (
              <p className="rounded-md bg-error-container/30 px-3 py-2 text-[12px] font-semibold text-on-surface">
                {cameraError}
              </p>
            )}

            {signOffline ? (
              <p className="flex items-start gap-2 rounded-md bg-secondary-fixed/40 px-3 py-2 text-[12px] leading-snug text-on-surface">
                <Icon name="info" className="mt-px shrink-0 text-[16px] text-secondary" />
                <span>
                  {SIGN_OFFLINE_MESSAGE} Cevabını aşağıya yazabilir veya hazır cümlelere
                  dokunabilirsin.
                </span>
              </p>
            ) : (
              <p className="text-[12px] leading-snug text-on-surface-variant">
                Video kaydı yok: kamerayı aç, işaret yap — altta canlı yazar. En iyiler:{' '}
                <strong className="text-on-surface">MERHABA</strong>,{' '}
                <strong className="text-on-surface">EVET</strong>.
              </p>
            )}

            <div className="rounded-md bg-surface-container-low">
              <button
                type="button"
                onClick={() => setGuideOpen((v) => !v)}
                className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left"
              >
                <span className="flex items-center gap-2 text-[13px] font-bold text-on-surface">
                  <Icon name="sign_language" className="text-[18px] text-primary" />
                  TİD nasıl yapılır? (20 kelime)
                </span>
                <Icon
                  name={guideOpen ? 'expand_less' : 'expand_more'}
                  className="text-[22px] text-on-surface-variant"
                />
              </button>
              {guideOpen && (
                <ul className="max-h-64 space-y-2 overflow-y-auto border-t border-outline-variant/30 px-3 py-2">
                  {SIGN_GUIDE.map((s) => (
                    <li key={s.word} className="text-[12px] leading-snug">
                      <span className="font-bold text-primary">{s.word}</span>
                      {s.tip && (
                        <span className="ml-1 text-[10px] font-semibold text-tertiary">
                          · {s.tip}
                        </span>
                      )}
                      <p className="mt-0.5 text-on-surface-variant">{s.how}</p>
                    </li>
                  ))}
                  <li className="pb-1 text-[11px] text-outline">
                    Resmi video:{' '}
                    <a
                      className="font-semibold text-primary underline"
                      href="https://tidsozluk.aile.gov.tr/"
                      target="_blank"
                      rel="noreferrer"
                    >
                      tidsozluk.aile.gov.tr
                    </a>
                  </li>
                </ul>
              )}
            </div>

            <div
              className="relative mx-auto flex aspect-[3/4] w-full max-w-sm select-none flex-col justify-between overflow-hidden rounded-md bg-black p-3 shadow-inner"
              title={cameraOn ? 'Canlı TİD tanıma' : 'Önce kamerayı aç'}
            >
              <video
                ref={videoRef}
                muted
                playsInline
                autoPlay
                className="absolute inset-0 z-0 h-full w-full object-cover object-[center_20%]"
                style={{
                  transform: facingMode === 'user' ? 'scaleX(-1)' : undefined,
                  opacity: cameraOn ? 1 : 0,
                }}
              />
              {!cameraOn && (
                <div className="absolute inset-0 z-[1] flex flex-col items-center justify-center gap-2 bg-surface-container-highest">
                  <img
                    src={CAMERA_IMG}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover opacity-40"
                  />
                  <div className="relative z-[2] flex flex-col items-center gap-2 px-4 text-center">
                    <Icon name="videocam" className="text-[36px] text-primary" />
                    <p className="text-sm font-semibold text-on-surface">
                      {cameraBusy
                        ? 'Kamera açılıyor…'
                        : cameraError || 'Kendi görüntünü görmek için dokun'}
                    </p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        void startCamera()
                      }}
                      className="mt-1 rounded-md bg-primary-container px-4 py-2 text-[13px] font-bold text-on-primary shadow-sm active:scale-95"
                    >
                      Kamerayı Aç
                    </button>
                  </div>
                </div>
              )}

              {cameraOn && (
                <div className="pointer-events-none absolute inset-0 z-[1] overflow-hidden">
                  <div className="scan-beam h-8 w-full bg-gradient-to-b from-transparent via-tertiary-fixed-dim/15 to-transparent" />
                </div>
              )}

              <div className="relative z-[2] flex items-center justify-between">
                <div className="flex items-center gap-1.5 rounded-full border border-white/40 bg-black/55 px-2.5 py-1 shadow-sm backdrop-blur-md">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-secondary-container opacity-80" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-secondary-container" />
                  </span>
                  <span className="text-[11px] font-semibold text-white">
                    {cameraBusy
                      ? 'Açılıyor…'
                      : recognizing
                        ? 'Canlı tanıma…'
                        : cameraOn
                          ? liveConf > 0
                            ? `Canlı · %${Math.round(liveConf * 100)}`
                            : 'Canlı kamera'
                          : 'Kamera kapalı'}
                  </span>
                </div>
                <button
                  type="button"
                  aria-label="Kamerayı Çevir"
                  onClick={(e) => {
                    e.stopPropagation()
                    setFlipDeg((d) => d + 180)
                    setFacingMode((f) => (f === 'user' ? 'environment' : 'user'))
                  }}
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-white/40 bg-black/55 text-white shadow-sm backdrop-blur-md transition-transform duration-200 active:scale-90"
                >
                  <span
                    className="material-symbols-outlined text-[18px] transition-transform duration-500"
                    style={{ transform: `rotate(${flipDeg}deg)` }}
                    aria-hidden
                  >
                    flip_camera_ios
                  </span>
                </button>
              </div>

              <div className="relative z-[2] flex items-center gap-2 rounded-md border border-white/40 bg-black/60 p-2 shadow-md backdrop-blur-md">
                <Icon
                  name={recognizing ? 'progress_activity' : cameraOn ? 'check_circle' : 'videocam_off'}
                  className={`text-[20px] text-tertiary-fixed ${recognizing ? 'animate-spin' : ''}`}
                />
                <div className="flex min-w-0 flex-col">
                  <span className="text-[11px] font-medium text-white/80">
                    Algılanan İşaret:
                  </span>
                  <span className="truncate text-[15px] font-bold tracking-tight text-white">
                    {detected}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-1 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="reply-input"
                  className="text-[11px] font-bold tracking-wider text-on-surface-variant uppercase"
                >
                  Yaz • Güvenli Alternatif
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setReply('')
                    inputRef.current?.focus()
                  }}
                  className="cursor-pointer rounded px-1 py-0.5 text-[11px] font-semibold text-primary transition-colors hover:bg-surface-container hover:text-primary-container active:scale-95"
                >
                  Temizle
                </button>
              </div>
              <div className="relative w-full">
                <input
                  ref={inputRef}
                  id="reply-input"
                  type="text"
                  value={reply}
                  onChange={(e) => {
                    setReply(e.target.value)
                    setDetected(e.target.value ? `“${e.target.value}”` : '“…”')
                  }}
                  placeholder="Veya buraya kendi cümleni yaz..."
                  className="h-12 w-full rounded-md bg-surface-container-low pr-11 pl-3.5 text-base text-on-surface shadow-inner transition-all duration-200 focus:ring-2 focus:ring-primary focus:outline-none"
                />
                <button
                  type="button"
                  aria-label="Klavye Aç"
                  onClick={() => inputRef.current?.focus()}
                  className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-md text-on-surface-variant transition-all hover:text-primary active:scale-90"
                >
                  <Icon name="keyboard" className="text-[20px]" />
                </button>
              </div>
              <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto py-1">
                {quickPhrases.map((phrase) => (
                  <button
                    key={phrase}
                    type="button"
                    onClick={() => onChip(phrase)}
                    className={`shrink-0 cursor-pointer rounded-full border border-transparent px-3 py-1.5 text-[13px] font-semibold text-on-surface shadow-sm transition-all duration-150 active:scale-95 ${
                      chipFlash === phrase
                        ? 'bg-primary-fixed text-on-primary-fixed'
                        : 'bg-surface-container hover:border-primary/20 hover:bg-surface-container-high'
                    }`}
                  >
                    {phrase}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={onSpeak}
              disabled={speakState !== 'idle'}
              className={`relative mt-1 flex h-12 w-full cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-md text-lg font-semibold text-on-primary shadow-md transition-all duration-200 active:scale-[0.98] ${
                speakState === 'done' ? 'bg-tertiary-container' : 'bg-primary-container'
              } ${speakState === 'sending' ? 'scale-[0.97]' : ''}`}
            >
              <Icon
                name={
                  speakState === 'sending'
                    ? 'sensors'
                    : speakState === 'done'
                      ? 'check_circle'
                      : 'volume_up'
                }
                className={`text-[22px] ${speakState === 'sending' ? 'animate-spin' : ''}`}
              />
              <span>
                {speakState === 'sending'
                  ? 'İletiliyor & Seslendiriliyor...'
                  : speakState === 'done'
                    ? 'Başarıyla Karşıya İletildi!'
                    : 'Sesli Oku / Karşıya İlet'}
              </span>
              <div
                className={`pointer-events-none absolute inset-0 bg-white/10 transition-opacity ${
                  speakState === 'sending' ? 'opacity-100' : 'opacity-0'
                }`}
              />
            </button>
          </div>
        </div>
      </main>
    </>
  )
}
