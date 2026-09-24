import { useCallback, useEffect, useRef, useState } from 'react'

/** Tarayıcı seslendirmesi (TTS). Desteklenmiyorsa false döner. */
export function speakTr(text: string, onEnd?: () => void): boolean {
  if (typeof window === 'undefined' || !window.speechSynthesis || !text.trim()) return false
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'tr-TR'
  u.rate = 0.95
  if (onEnd) {
    u.onend = onEnd
    u.onerror = onEnd
  }
  window.speechSynthesis.speak(u)
  return true
}

type RecognitionAlternative = { transcript: string }
type RecognitionResult = ArrayLike<RecognitionAlternative> & { isFinal: boolean }
type RecognitionEvent = { resultIndex: number; results: ArrayLike<RecognitionResult> }
type RecognitionErrorEvent = { error: string }

type Recognition = {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((e: RecognitionEvent) => void) | null
  onerror: ((e: RecognitionErrorEvent) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

type RecognitionCtor = new () => Recognition

function getRecognitionCtor(): RecognitionCtor | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as {
    SpeechRecognition?: RecognitionCtor
    webkitSpeechRecognition?: RecognitionCtor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

/** null = geçici durum, dinlemeye devam edilir */
function recognitionErrorMessage(code: string): string | null {
  switch (code) {
    case 'no-speech':
    case 'aborted':
      return null
    case 'not-allowed':
    case 'service-not-allowed':
      return 'Mikrofon izni reddedildi — tarayıcı adres çubuğundan izin ver'
    case 'audio-capture':
      return 'Mikrofon bulunamadı'
    case 'network':
      return 'Canlı altyazı için internet bağlantısı gerekli'
    case 'language-not-supported':
      return 'Bu tarayıcı Türkçe konuşma tanımayı desteklemiyor'
    default:
      return 'Canlı altyazı durdu, tekrar başlat'
  }
}

const MAX_LINES = 4

export function useLiveCaptions() {
  const [supported] = useState(() => getRecognitionCtor() !== null)
  const [listening, setListening] = useState(false)
  const [lines, setLines] = useState<string[]>([])
  const [interim, setInterim] = useState('')
  const [error, setError] = useState<string | null>(null)
  const recRef = useRef<Recognition | null>(null)
  const wantRef = useRef(false)

  const stop = useCallback(() => {
    wantRef.current = false
    recRef.current?.stop()
  }, [])

  const start = useCallback((): boolean => {
    const Ctor = getRecognitionCtor()
    if (!Ctor) {
      setError('Bu tarayıcı canlı altyazıyı desteklemiyor — Chrome veya Safari kullan')
      return false
    }
    if (recRef.current) return true

    setError(null)
    wantRef.current = true
    const rec = new Ctor()
    rec.lang = 'tr-TR'
    rec.continuous = true
    rec.interimResults = true

    rec.onresult = (e) => {
      const finals: string[] = []
      let pending = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i]
        const text = result[0]?.transcript.trim() ?? ''
        if (!text) continue
        if (result.isFinal) finals.push(text)
        else pending = pending ? `${pending} ${text}` : text
      }
      if (finals.length) setLines((prev) => [...prev, ...finals].slice(-MAX_LINES))
      setInterim(pending)
    }

    rec.onerror = (e) => {
      const msg = recognitionErrorMessage(e.error)
      if (msg) {
        wantRef.current = false
        setError(msg)
      }
    }

    // Tarayıcılar sessizlikten sonra tanımayı kendiliğinden kapatır; kullanıcı durdurmadıysa yeniden başlat
    rec.onend = () => {
      setInterim('')
      if (wantRef.current) {
        try {
          rec.start()
          return
        } catch {
          // yeniden başlatılamadı — aşağıda kapat
        }
      }
      recRef.current = null
      wantRef.current = false
      setListening(false)
    }

    recRef.current = rec
    try {
      rec.start()
      setListening(true)
      return true
    } catch {
      recRef.current = null
      wantRef.current = false
      setError('Canlı altyazı başlatılamadı')
      return false
    }
  }, [])

  const clear = useCallback(() => {
    setLines([])
    setInterim('')
  }, [])

  useEffect(() => {
    return () => {
      wantRef.current = false
      recRef.current?.abort()
      recRef.current = null
    }
  }, [])

  return { supported, listening, lines, interim, error, start, stop, clear }
}
