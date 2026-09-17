import {
  INDEX_TO_TYPE,
  MIN_CONSECUTIVE_WINDOWS,
  NAME_TO_TYPE,
  SOUND_CLASSES,
  SPEECH_INDEX_SET,
  SPEECH_NAME_SET,
  SPEECH_SCORE_SKIP,
  type SoundType,
} from './soundClasses'
import type { ClassScore, RadarMode, RadarSettings } from './types'

export function bestScoreForType(top: ClassScore[], type: SoundType): ClassScore | null {
  const cfg = SOUND_CLASSES[type]
  const names = new Set(cfg.yamnetNames)
  const indices = new Set(cfg.yamnetIndices)
  let best: ClassScore | null = null
  for (const row of top) {
    if (!names.has(row.name) && !indices.has(row.index)) continue
    if (!best || row.score > best.score) best = row
  }
  return best
}

export function isSpeechWindow(top: ClassScore[]): boolean {
  return top.some(
    (row) =>
      (SPEECH_NAME_SET.has(row.name) || SPEECH_INDEX_SET.has(row.index)) &&
      row.score >= SPEECH_SCORE_SKIP,
  )
}

export function typeFromClass(row: ClassScore): SoundType | null {
  return INDEX_TO_TYPE.get(row.index) ?? NAME_TO_TYPE.get(row.name) ?? null
}

export class DetectionGate {
  private streaks: Partial<Record<SoundType, number>> = {}
  private lastAlertAt: Partial<Record<SoundType, number>> = {}
  private snoozedUntil: Partial<Record<SoundType, number>> = {}

  snooze(type: SoundType, ms: number, now = Date.now()) {
    this.snoozedUntil[type] = now + ms
  }

  reset() {
    this.streaks = {}
    this.lastAlertAt = {}
    this.snoozedUntil = {}
  }

  consider(
    top: ClassScore[],
    settings: RadarSettings,
    mode: RadarMode,
    now = Date.now(),
  ): { type: SoundType; matched: ClassScore } | null {
    const hits = new Set<SoundType>()
    const matched: Partial<Record<SoundType, ClassScore>> = {}

    for (const type of Object.keys(SOUND_CLASSES) as SoundType[]) {
      if (!settings[type]) continue
      const cfg = SOUND_CLASSES[type]
      if (cfg.modes && !cfg.modes.includes(mode)) continue
      if ((this.snoozedUntil[type] ?? 0) > now) continue
      if ((this.lastAlertAt[type] ?? 0) + cfg.cooldownMs > now) continue

      const score = bestScoreForType(top, type)
      if (score && score.score >= cfg.threshold) {
        hits.add(type)
        matched[type] = score
      }
    }

    // Konuşma baskınsa ve kritik ses yoksa streak sıfırla
    if (isSpeechWindow(top) && hits.size === 0) {
      this.streaks = {}
      return null
    }

    for (const type of Object.keys(SOUND_CLASSES) as SoundType[]) {
      this.streaks[type] = hits.has(type) ? (this.streaks[type] ?? 0) + 1 : 0
    }

    let winner: SoundType | null = null
    let winnerScore = 0
    for (const type of hits) {
      if ((this.streaks[type] ?? 0) < MIN_CONSECUTIVE_WINDOWS) continue
      const row = matched[type]
      if (row && row.score > winnerScore) {
        winner = type
        winnerScore = row.score
      }
    }

    if (!winner) return null
    const row = matched[winner]
    if (!row) return null
    this.lastAlertAt[winner] = now
    this.streaks[winner] = 0
    return { type: winner, matched: row }
  }
}
