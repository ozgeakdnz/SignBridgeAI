import { VIBRATION_LEVELS, type VibrationLevel } from './soundClasses'
import type { RadarSettings } from './types'

const STORAGE_KEY = 'signbridge.radar.settings.v1'

export const DEFAULT_RADAR_SETTINGS: RadarSettings = {
  doorbell: true,
  siren: true,
  baby: true,
  horn: true,
  strobe: true,
  vibration: 'Güçlü',
}

function isVibration(value: unknown): value is VibrationLevel {
  return VIBRATION_LEVELS.includes(value as VibrationLevel)
}

export function loadRadarSettings(): RadarSettings {
  if (typeof window === 'undefined') return DEFAULT_RADAR_SETTINGS
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_RADAR_SETTINGS
    const parsed = JSON.parse(raw) as Partial<RadarSettings>
    return {
      doorbell: parsed.doorbell ?? true,
      siren: parsed.siren ?? true,
      baby: parsed.baby ?? true,
      horn: parsed.horn ?? true,
      strobe: parsed.strobe ?? true,
      vibration: isVibration(parsed.vibration) ? parsed.vibration : 'Güçlü',
    }
  } catch {
    return DEFAULT_RADAR_SETTINGS
  }
}

export function saveRadarSettings(settings: RadarSettings) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    /* kota / gizli mod */
  }
}
