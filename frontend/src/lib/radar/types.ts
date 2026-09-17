import type { SoundType, VibrationLevel } from './soundClasses'

export type RadarMode = 'home' | 'outdoor'

export type RadarStatus =
  | 'idle'
  | 'starting'
  | 'listening'
  | 'denied'
  | 'unsupported'
  | 'error'

export type RadarToggles = {
  doorbell: boolean
  siren: boolean
  baby: boolean
  horn: boolean
  strobe: boolean
}

export type RadarSettings = RadarToggles & {
  vibration: VibrationLevel
}

export type ClassScore = {
  name: string
  index: number
  score: number
}

export type RadarDetection = {
  id: string
  type: SoundType
  label: string
  icon: string
  score: number
  matchedClass: string
  vibrationLabel: string
  at: number
}

export type RadarState = {
  status: RadarStatus
  mode: RadarMode
  settings: RadarSettings
  errorMessage: string | null
  modelReady: boolean
  latest: RadarDetection | null
  history: RadarDetection[]
  overlay: RadarDetection | null
  strobeOn: boolean
  topClasses: ClassScore[]
  lastInferMs: number | null
}

export type WorkerInitMessage = {
  type: 'init'
  origin: string
  wasmPath: string
  modelPath: string
}

export type WorkerInferMessage = {
  type: 'infer'
  id: number
  samples: Float32Array
  sampleRate: number
}

export type WorkerIncoming = WorkerInitMessage | WorkerInferMessage | { type: 'dispose' }

export type WorkerOutgoing =
  | { type: 'ready' }
  | { type: 'result'; id: number; top: ClassScore[]; inferMs: number }
  | { type: 'error'; message: string }
