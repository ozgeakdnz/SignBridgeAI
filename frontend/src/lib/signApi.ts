/** Backend API tabanı — tek kaynak */
const hostname = typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1'

export const API_BASE =
  import.meta.env.VITE_API_BASE?.toString() ||
  (hostname === 'localhost' || hostname === '127.0.0.1'
    ? 'http://127.0.0.1:8000'
    : `http://${hostname}:8000`)

export type SignPredictResponse = {
  success: boolean
  label: string | null
  confidence: number
  message?: string
  hands?: boolean
  buffer?: number
  ready?: boolean
  candidate?: string
  margin?: number
}

export async function predictSignVideo(blob: Blob): Promise<SignPredictResponse> {
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
    if (!res.ok) {
      return {
        success: false,
        label: null,
        confidence: 0,
        message: `Sunucu hatası (${res.status})`,
      }
    }
    return (await res.json()) as SignPredictResponse
  } catch (e) {
    const aborted = e instanceof DOMException && e.name === 'AbortError'
    return {
      success: false,
      label: null,
      confidence: 0,
      message: aborted
        ? 'İstek zaman aşımına uğradı.'
        : "Backend'e bağlanılamadı. uvicorn çalışıyor mu?",
    }
  } finally {
    window.clearTimeout(timer)
  }
}

/** Canlı kare → landmark tamponu → anlık tahmin (video kaydı yok) */
export async function predictLiveFrame(
  sessionId: string,
  jpeg: Blob,
): Promise<SignPredictResponse> {
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
    if (!res.ok) {
      return {
        success: false,
        label: null,
        confidence: 0,
        message: `Sunucu hatası (${res.status})`,
      }
    }
    return (await res.json()) as SignPredictResponse
  } catch {
    return {
      success: false,
      label: null,
      confidence: 0,
      message: "Backend'e bağlanılamadı.",
    }
  } finally {
    window.clearTimeout(timer)
  }
}

export async function resetLiveSession(sessionId: string): Promise<void> {
  const form = new FormData()
  form.append('session_id', sessionId)
  try {
    await fetch(`${API_BASE}/api/sign/live-reset`, { method: 'POST', body: form })
  } catch {
    // ignore
  }
}
