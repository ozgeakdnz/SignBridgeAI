import {
  ensureNotificationPermission,
  notifyDetection,
  TorchController,
  vibrateFor,
} from './alerts'
import { classifyMain, initYamnetMain } from './yamnetMain'
import { startMicCapture, rms } from './audioCapture'
import { DetectionGate } from './evaluate'
import { loadRadarSettings, saveRadarSettings } from './settings'
import {
  SILENCE_RMS,
  SOUND_CLASSES,
  YAMNET_HOP_SAMPLES,
  YAMNET_SAMPLE_RATE,
  YAMNET_WINDOW_SAMPLES,
  type SoundType,
} from './soundClasses'
import type {
  ClassScore,
  RadarDetection,
  RadarMode,
  RadarSettings,
  RadarState,
  RadarStatus,
  WorkerIncoming,
} from './types'

const HISTORY_LIMIT = 20
const OVERLAY_MS = 8000
const SNOOZE_MS = 60_000

function permissionMessage(err: unknown): { status: RadarStatus; message: string } {
  const name = err instanceof DOMException ? err.name : ''
  const text = err instanceof Error ? err.message : ''
  if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
    return {
      status: 'denied',
      message:
        'Mikrofon izni reddedildi. Akustik Radar çevredeki kritik sesleri dinlemek için mikrofona ihtiyaç duyar. Tarayıcı ayarlarından izin verip tekrar deneyin.',
    }
  }
  if (name === 'NotFoundError') {
    return {
      status: 'unsupported',
      message: 'Bu cihazda mikrofon bulunamadı. Akustik Radar için bir mikrofon gerekir.',
    }
  }
  if (!window.isSecureContext) {
    return {
      status: 'unsupported',
      message: 'Mikrofon yalnızca güvenli bağlamda (HTTPS veya localhost) kullanılabilir.',
    }
  }
  return {
    status: 'error',
    message: text || 'Mikrofon başlatılamadı.',
  }
}

export class AcousticRadarEngine {
  private listeners = new Set<(state: RadarState) => void>()
  private status: RadarStatus = 'idle'
  private mode: RadarMode = 'home'
  private settings: RadarSettings = loadRadarSettings()
  private errorMessage: string | null = null
  private modelReady = false
  private latest: RadarDetection | null = null
  private history: RadarDetection[] = []
  private overlay: RadarDetection | null = null
  private strobeOn = false
  private topClasses: ClassScore[] = []
  private lastInferMs: number | null = null
  private worker: Worker | null = null
  private useMainThread = false
  private inferBusy = false
  private nextInferId = 1
  private pendingId = 0
  private pcm = new Float32Array(0)
  private capture: Awaited<ReturnType<typeof startMicCapture>> | null = null
  private gate = new DetectionGate()
  private torch = new TorchController()
  private overlayTimer: number | null = null
  private strobeTimer: number | null = null
  private queued: Float32Array | null = null
  private wakeLock: { release: () => Promise<void> } | null = null

  getState(): RadarState {
    return {
      status: this.status,
      mode: this.mode,
      settings: this.settings,
      errorMessage: this.errorMessage,
      modelReady: this.modelReady,
      latest: this.latest,
      history: this.history,
      overlay: this.overlay,
      strobeOn: this.strobeOn,
      topClasses: this.topClasses,
      lastInferMs: this.lastInferMs,
    }
  }

  subscribe(fn: (state: RadarState) => void) {
    this.listeners.add(fn)
    fn(this.getState())
    return () => {
      this.listeners.delete(fn)
    }
  }

  private emit() {
    const snapshot = this.getState()
    for (const fn of this.listeners) fn(snapshot)
  }

  setMode(mode: RadarMode) {
    this.mode = mode
    this.emit()
  }

  setSettings(patch: Partial<RadarSettings>) {
    this.settings = { ...this.settings, ...patch }
    saveRadarSettings(this.settings)
    if (!this.settings.strobe) this.torch.release()
    this.emit()
  }

  dismissOverlay() {
    this.overlay = null
    this.strobeOn = false
    this.clearTimers()
    this.emit()
  }

  snoozeLatest() {
    if (this.latest) this.gate.snooze(this.latest.type, SNOOZE_MS)
    this.dismissOverlay()
  }

  async toggle() {
    if (this.status === 'listening' || this.status === 'starting') {
      this.stop()
      return
    }
    await this.start()
  }

  async start() {
    if (this.status === 'listening' || this.status === 'starting') return
    if (!navigator.mediaDevices?.getUserMedia) {
      this.status = 'unsupported'
      this.errorMessage =
        'Bu tarayıcı mikrofon API’sini desteklemiyor. Android Chrome ile deneyin.'
      this.emit()
      return
    }

    this.status = 'starting'
    this.errorMessage = null
    this.emit()

    try {
      await this.ensureWorker()
      this.capture = await startMicCapture((chunk) => this.onPcm(chunk))
      this.gate.reset()
      this.pcm = new Float32Array(0)
      void ensureNotificationPermission()
      if (this.settings.strobe) void this.torch.acquire()
      await this.requestWakeLock()
      this.status = 'listening'
      this.emit()
      this.warmupInfer()
    } catch (err) {
      const mapped = permissionMessage(err)
      this.status = mapped.status
      this.errorMessage = mapped.message
      this.stopCaptureOnly()
      this.emit()
    }
  }

  stop() {
    this.stopCaptureOnly()
    this.status = this.status === 'denied' || this.status === 'unsupported' ? this.status : 'idle'
    if (this.status !== 'denied' && this.status !== 'unsupported') this.errorMessage = null
    this.dismissOverlay()
    this.emit()
  }

  private stopCaptureOnly() {
    this.capture?.stop()
    this.capture = null
    this.torch.release()
    void this.releaseWakeLock()
    this.pcm = new Float32Array(0)
    this.inferBusy = false
  }

  private async ensureWorker() {
    if (this.modelReady && this.useMainThread) return
    this.modelReady = false
    this.worker?.terminate()
    this.worker = null
    await initYamnetMain(window.location.origin)
    this.useMainThread = true
    this.modelReady = true
  }

  private warmupInfer() {
    const tone = new Float32Array(YAMNET_WINDOW_SAMPLES)
    for (let i = 0; i < tone.length; i++) {
      tone[i] = 0.2 * Math.sin((2 * Math.PI * 1000 * i) / YAMNET_SAMPLE_RATE)
    }
    this.inferBusy = true
    this.pendingId = this.nextInferId++
    if (this.useMainThread) {
      try {
        const { top, inferMs } = classifyMain(tone, YAMNET_SAMPLE_RATE)
        this.onResult(this.pendingId, top, inferMs)
      } catch (err) {
        this.inferBusy = false
        this.errorMessage = err instanceof Error ? err.message : 'Isınma çıkarımı başarısız.'
        this.emit()
      }
      return
    }
    this.worker?.postMessage(
      {
        type: 'infer' as const,
        id: this.pendingId,
        samples: tone,
        sampleRate: YAMNET_SAMPLE_RATE,
      },
      [tone.buffer],
    )
  }

  private onPcm(chunk: Float32Array) {
    if (this.status !== 'listening') return
    const merged = new Float32Array(this.pcm.length + chunk.length)
    merged.set(this.pcm)
    merged.set(chunk, this.pcm.length)
    this.pcm = merged

    while (this.pcm.length >= YAMNET_WINDOW_SAMPLES) {
      const window = this.pcm.slice(0, YAMNET_WINDOW_SAMPLES)
      this.pcm = this.pcm.slice(YAMNET_HOP_SAMPLES)
      this.queueInfer(window)
    }
  }

  private queueInfer(window: Float32Array) {
    if (!this.modelReady) return
    if (this.inferBusy) {
      this.queued = window
      return
    }
    if (rms(window) < SILENCE_RMS) {
      this.gate.consider([], this.settings, this.mode)
      return
    }
    this.inferBusy = true
    this.pendingId = this.nextInferId++
    if (this.useMainThread) {
      try {
        const { top, inferMs } = classifyMain(window, YAMNET_SAMPLE_RATE)
        this.onResult(this.pendingId, top, inferMs)
      } catch (err) {
        this.inferBusy = false
        this.errorMessage = err instanceof Error ? err.message : 'Çıkarım başarısız.'
        this.emit()
      }
      return
    }
    if (!this.worker) {
      this.inferBusy = false
      return
    }
    this.worker.postMessage(
      {
        type: 'infer',
        id: this.pendingId,
        samples: window,
        sampleRate: YAMNET_SAMPLE_RATE,
      } satisfies WorkerIncoming,
      [window.buffer],
    )
  }

  private onResult(id: number, top: ClassScore[], inferMs: number) {
    this.inferBusy = false
    if (id !== this.pendingId) return
    this.topClasses = top.slice(0, 5)
    this.lastInferMs = inferMs
    const hit = this.gate.consider(top, this.settings, this.mode)
    if (hit) this.fire(hit.type, hit.matched)
    else this.emit()
    if (this.queued) {
      const next = this.queued
      this.queued = null
      this.queueInfer(next)
    }
  }

  private fire(type: SoundType, matched: ClassScore) {
    const cfg = SOUND_CLASSES[type]
    const detection: RadarDetection = {
      id: `${type}-${Date.now()}`,
      type,
      label: cfg.label,
      icon: cfg.icon,
      score: matched.score,
      matchedClass: matched.name,
      vibrationLabel: cfg.vibrationLabel,
      at: Date.now(),
    }
    this.latest = detection
    this.history = [detection, ...this.history].slice(0, HISTORY_LIMIT)
    this.overlay = detection
    vibrateFor(type, this.settings.vibration)
    void notifyDetection(
      cfg.label,
      `${Math.round(matched.score * 100)}% • ${matched.name}`,
      `radar-${type}`,
    )
    this.startOverlayTimer()
    if (this.settings.strobe) {
      this.flashScreen()
      void this.torch.pulse()
    }
    this.emit()
  }

  private startOverlayTimer() {
    if (this.overlayTimer) window.clearTimeout(this.overlayTimer)
    this.overlayTimer = window.setTimeout(() => {
      this.overlay = null
      this.emit()
    }, OVERLAY_MS)
  }

  private flashScreen() {
    this.strobeOn = true
    this.emit()
    if (this.strobeTimer) window.clearTimeout(this.strobeTimer)
    const pulses = [0, 160, 280, 440]
    pulses.forEach((delay, i) => {
      window.setTimeout(() => {
        this.strobeOn = i % 2 === 0
        this.emit()
      }, delay)
    })
    this.strobeTimer = window.setTimeout(() => {
      this.strobeOn = false
      this.emit()
    }, 560)
  }

  triggerStrobeTest() {
    this.flashScreen()
    if (this.settings.strobe) void this.torch.pulse(3)
  }

  private clearTimers() {
    if (this.overlayTimer) window.clearTimeout(this.overlayTimer)
    if (this.strobeTimer) window.clearTimeout(this.strobeTimer)
    this.overlayTimer = null
    this.strobeTimer = null
  }

  private async requestWakeLock() {
    try {
      const nav = navigator as Navigator & {
        wakeLock?: { request: (type: 'screen') => Promise<{ release: () => Promise<void> }> }
      }
      this.wakeLock = (await nav.wakeLock?.request('screen')) ?? null
    } catch {
      this.wakeLock = null
    }
  }

  private async releaseWakeLock() {
    try {
      await this.wakeLock?.release()
    } catch {
      /* ignore */
    }
    this.wakeLock = null
  }
}

export const radarEngine = new AcousticRadarEngine()
