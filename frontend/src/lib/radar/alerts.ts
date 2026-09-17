import { SOUND_CLASSES, type SoundType, type VibrationLevel } from './soundClasses'

const SCALE: Record<VibrationLevel, number> = {
  Hafif: 0.55,
  Dengeli: 1,
  Güçlü: 1.4,
}

export function vibrationPattern(type: SoundType, level: VibrationLevel): number[] {
  const raw = SOUND_CLASSES[type].vibrationPattern
  const s = SCALE[level]
  const scaled = raw.map((ms, i) => {
    if (i % 2 === 1) return ms
    return Math.max(40, Math.round(ms * s))
  })
  if (level === 'Güçlü') return [...scaled, 120, ...scaled]
  return [...scaled]
}

export function vibrateFor(type: SoundType, level: VibrationLevel) {
  const pattern = vibrationPattern(type, level)
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return false
  try {
    return navigator.vibrate(pattern)
  } catch {
    return false
  }
}

export function formatClock(ts: number): string {
  return new Intl.DateTimeFormat('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(ts)
}

export async function notifyDetection(title: string, body: string, tag: string) {
  if (typeof Notification === 'undefined') return
  if (Notification.permission !== 'granted') return
  if (!document.hidden) return
  try {
    new Notification(title, { body, tag, silent: true })
  } catch {
    /* iOS / izin */
  }
}

export async function ensureNotificationPermission() {
  if (typeof Notification === 'undefined') return 'unsupported' as const
  if (Notification.permission === 'granted') return 'granted' as const
  if (Notification.permission === 'denied') return 'denied' as const
  try {
    return await Notification.requestPermission()
  } catch {
    return 'denied' as const
  }
}

function torchConstraints(on: boolean) {
  return { advanced: [{ torch: on }] } as unknown as MediaTrackConstraints
}

export class TorchController {
  private stream: MediaStream | null = null
  private track: MediaStreamTrack | null = null
  private pulsing = false

  async acquire(): Promise<boolean> {
    if (this.track) return true
    if (!navigator.mediaDevices?.getUserMedia) return false
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
      })
      this.track = this.stream.getVideoTracks()[0]
      const caps = this.track.getCapabilities() as MediaTrackCapabilities & { torch?: boolean }
      if (!caps.torch) {
        this.release()
        return false
      }
      return true
    } catch {
      this.release()
      return false
    }
  }

  async pulse(flashes = 4) {
    if (this.pulsing) return
    if (!this.track) return
    this.pulsing = true
    try {
      for (let i = 0; i < flashes; i++) {
        await this.track.applyConstraints(torchConstraints(true))
        await sleep(110)
        await this.track.applyConstraints(torchConstraints(false))
        await sleep(90)
      }
    } catch {
      /* cihaz torch desteklemiyor */
    } finally {
      this.pulsing = false
    }
  }

  release() {
    this.stream?.getTracks().forEach((t) => t.stop())
    this.stream = null
    this.track = null
  }
}

function sleep(ms: number) {
  return new Promise<void>((r) => window.setTimeout(r, ms))
}
