/**
 * YAMNet (521 AudioSet sınıfı) eşlemesi.
 * Sınıf adları ve indeksler yamnet_class_map.csv dosyasından alınmıştır;
 * uydurma ad kullanılmaz.
 */

export const YAMNET_SAMPLE_RATE = 16_000
export const YAMNET_WINDOW_SAMPLES = 15_600 // ~0.975 sn
export const YAMNET_HOP_SAMPLES = 7_800 // ~0.4875 sn örtüşme

export const SOUND_TYPES = ['doorbell', 'siren', 'baby', 'horn'] as const
export type SoundType = (typeof SOUND_TYPES)[number]

export const VIBRATION_LEVELS = ['Hafif', 'Dengeli', 'Güçlü'] as const
export type VibrationLevel = (typeof VIBRATION_LEVELS)[number]

export type SoundClassConfig = {
  id: SoundType
  label: string
  icon: string
  /** yamnet_class_map.csv içindeki gerçek display_name değerleri */
  yamnetNames: readonly string[]
  /** yamnet_class_map.csv içindeki gerçek index değerleri */
  yamnetIndices: readonly number[]
  threshold: number
  /** Navigator.vibrate milisaniye deseni (titreşim, boşluk, titreşim...) */
  vibrationPattern: readonly number[]
  vibrationLabel: string
  /** Ev / dış mekan filtresi. undefined = her iki mod */
  modes?: readonly ('home' | 'outdoor')[]
  cooldownMs: number
}

export const SOUND_CLASSES: Record<SoundType, SoundClassConfig> = {
  doorbell: {
    id: 'doorbell',
    label: 'Kapı zili',
    icon: 'notifications_active',
    yamnetNames: ['Doorbell', 'Ding-dong'],
    yamnetIndices: [349, 350],
    threshold: 0.22,
    vibrationPattern: [420, 140, 420],
    vibrationLabel: 'Çift Uzun Vuruş',
    cooldownMs: 5000,
  },
  siren: {
    id: 'siren',
    label: 'Yangın / siren alarmı',
    icon: 'emergency_home',
    yamnetNames: [
      'Alarm',
      'Siren',
      'Civil defense siren',
      'Smoke detector, smoke alarm',
      'Fire alarm',
      'Police car (siren)',
      'Ambulance (siren)',
      'Fire engine, fire truck (siren)',
      'Buzzer',
      'Car alarm',
    ],
    yamnetIndices: [382, 390, 391, 393, 394, 317, 318, 319, 392, 304],
    threshold: 0.28,
    vibrationPattern: [180, 90, 180, 90, 180, 90, 180, 90, 180],
    vibrationLabel: 'Sürekli Nabız',
    cooldownMs: 8000,
  },
  baby: {
    id: 'baby',
    label: 'Bebek ağlaması',
    icon: 'child_care',
    yamnetNames: ['Baby cry, infant cry'],
    yamnetIndices: [20],
    threshold: 0.35,
    vibrationPattern: [90, 70, 160, 70, 260, 70, 160, 70, 90],
    vibrationLabel: 'Dalgalı Titreşim',
    cooldownMs: 8000,
  },
  horn: {
    id: 'horn',
    label: 'Araba kornası',
    icon: 'directions_car',
    yamnetNames: ['Vehicle horn, car horn, honking', 'Toot', 'Air horn, truck horn'],
    yamnetIndices: [302, 303, 312],
    threshold: 0.22,
    vibrationPattern: [80, 70, 80, 70, 320],
    vibrationLabel: 'Kısa-Kısa-Uzun',
    // Her iki modda da dene (önceden sadece outdoor → ekran değişmiyordu)
    modes: ['home', 'outdoor'],
    cooldownMs: 5000,
  },
}

/** Konuşma pencerelerinde uyarı üretme (class map adları). */
export const SPEECH_CLASS_NAMES = [
  'Speech',
  'Child speech, kid speaking',
  'Conversation',
  'Narration, monologue',
  'Babbling',
  'Speech synthesizer',
  'Shout',
  'Yell',
  'Children shouting',
  'Whispering',
  'Chatter',
  'Hubbub, speech noise, speech babble',
] as const

export const SPEECH_CLASS_INDICES = [0, 1, 2, 3, 4, 5, 6, 9, 10, 12, 63, 65] as const

export const SPEECH_SCORE_SKIP = 0.65
export const MIN_CONSECUTIVE_WINDOWS = 1
export const SILENCE_RMS = 0.005

export const NAME_TO_TYPE = new Map<string, SoundType>()
export const INDEX_TO_TYPE = new Map<number, SoundType>()

for (const cfg of Object.values(SOUND_CLASSES)) {
  for (const name of cfg.yamnetNames) NAME_TO_TYPE.set(name, cfg.id)
  for (const index of cfg.yamnetIndices) INDEX_TO_TYPE.set(index, cfg.id)
}

export const SPEECH_NAME_SET = new Set<string>(SPEECH_CLASS_NAMES)
export const SPEECH_INDEX_SET = new Set<number>(SPEECH_CLASS_INDICES)
