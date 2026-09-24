/** Backend API tabanı — tek kaynak */
function resolveApiBase(): string | null {
  const env = import.meta.env.VITE_API_BASE?.toString().trim()
  if (env) return env.replace(/\/+$/, '')
  if (typeof window === 'undefined') return null
  const { hostname, protocol } = window.location
  if (hostname === 'localhost' || hostname === '127.0.0.1') return 'http://127.0.0.1:8000'
  // HTTPS sayfadan http API'ye istek tarayıcıda engellenir; yalnızca LAN testinde (http) port 8000 denenir
  if (protocol === 'http:') return `http://${hostname}:8000`
  return null
}

export const API_BASE = resolveApiBase()

/** Backend adresi tanımlı mı (Vercel'de VITE_API_BASE yoksa false) */
export const SIGN_API_CONFIGURED = API_BASE !== null

export const SIGN_OFFLINE_MESSAGE = 'İşaret tanıma şu an kapalı.'

export type SignPredictResponse = {
  success: boolean
  label: string | null
  confidence: number
  message?: string
  /** Sunucuya hiç ulaşılamadı */
  offline?: boolean
  hands?: boolean
  buffer?: number
  ready?: boolean
  candidate?: string
  margin?: number
}

function offlineResponse(): SignPredictResponse {
  return {
    success: false,
    label: null,
    confidence: 0,
    message: SIGN_OFFLINE_MESSAGE,
    offline: true,
  }
}

function serverErrorResponse(status: number): SignPredictResponse {
  return {
    success: false,
    label: null,
    confidence: 0,
    message: `Sunucu hatası (${status})`,
  }
}

export async function predictSignVideo(blob: Blob): Promise<SignPredictResponse> {
  if (!API_BASE) return offlineResponse()

  const form = new FormData()
  const ext = blob.type.includes('webm') ? 'webm' : 'mp4'
  form.append('video', blob, `sign.${ext}`)

  const ctrl = new AbortController()
  const timer = window.setTimeout(() => ctrl.abort(), 30_000)

  try {
    const res = await fetch(`${API_BASE}/api/sign/predict`, {
      method: 'POST',
      body: form,
      signal: ctrl.signal,
    })
    if (!res.ok) return serverErrorResponse(res.status)
    return (await res.json()) as SignPredictResponse
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      return { success: false, label: null, confidence: 0, message: 'İstek zaman aşımına uğradı.' }
    }
    return offlineResponse()
  } finally {
    window.clearTimeout(timer)
  }
}

/** Canlı kare → landmark tamponu → anlık tahmin (video kaydı yok) */
export async function predictLiveFrame(
  sessionId: string,
  jpeg: Blob,
): Promise<SignPredictResponse> {
  if (!API_BASE) return offlineResponse()

  const form = new FormData()
  form.append('session_id', sessionId)
  form.append('frame', jpeg, 'frame.jpg')

  const ctrl = new AbortController()
  const timer = window.setTimeout(() => ctrl.abort(), 8_000)

  try {
    const res = await fetch(`${API_BASE}/api/sign/live-frame`, {
      method: 'POST',
      body: form,
      signal: ctrl.signal,
    })
    if (!res.ok) return serverErrorResponse(res.status)
    return (await res.json()) as SignPredictResponse
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      return { success: false, label: null, confidence: 0, message: 'İstek zaman aşımına uğradı.' }
    }
    return offlineResponse()
  } finally {
    window.clearTimeout(timer)
  }
}

export async function resetLiveSession(sessionId: string): Promise<void> {
  if (!API_BASE) return
  const form = new FormData()
  form.append('session_id', sessionId)
  try {
    await fetch(`${API_BASE}/api/sign/live-reset`, { method: 'POST', body: form })
  } catch {
    // ignore
  }
}
