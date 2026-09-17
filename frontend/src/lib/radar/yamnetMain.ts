import { AudioClassifier, FilesetResolver } from '@mediapipe/tasks-audio'
import type { ClassScore } from './types'

let classifier: AudioClassifier | null = null

function flattenTop(results: ReturnType<AudioClassifier['classify']>): ClassScore[] {
  const merged = new Map<string, ClassScore>()
  for (const result of results) {
    for (const head of result.classifications) {
      for (const cat of head.categories) {
        const name = (cat.categoryName || cat.displayName || '').trim()
        const key = `${cat.index}:${name}`
        const prev = merged.get(key)
        if (!prev || cat.score > prev.score) {
          merged.set(key, { name, index: cat.index, score: cat.score })
        }
      }
    }
  }
  return [...merged.values()].sort((a, b) => b.score - a.score)
}

export async function initYamnetMain(origin: string) {
  if (classifier) return
  const fileset = await FilesetResolver.forAudioTasks(`${origin}/mediapipe/audio/wasm`)
  classifier = await AudioClassifier.createFromOptions(fileset, {
    baseOptions: {
      modelAssetPath: `${origin}/models/yamnet/yamnet.tflite`,
      delegate: 'CPU',
    },
    maxResults: 40,
    scoreThreshold: 0.005,
  })
  classifier.setDefaultSampleRate(16000)
}

export function classifyMain(samples: Float32Array, sampleRate: number) {
  if (!classifier) throw new Error('YAMNet modeli henüz yüklenmedi.')
  const started = performance.now()
  const top = flattenTop(classifier.classify(samples, sampleRate))
  return { top, inferMs: Math.round(performance.now() - started) }
}

export function closeYamnetMain() {
  classifier?.close()
  classifier = null
}
