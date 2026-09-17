/* Classic worker: importScripts ile MediaPipe IIFE yüklenir (Vite ESM worker ModuleFactory kırıyor). */
/* global Audio */

let classifier = null

function flattenTop(results) {
  const merged = new Map()
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

self.onmessage = async (event) => {
  const data = event.data
  try {
    if (data.type === 'init') {
      importScripts(`${data.origin}/mediapipe/audio/audio_bundle.js`)
      const fileset = await Audio.FilesetResolver.forAudioTasks(`${data.origin}/mediapipe/audio/wasm`)
      classifier = await Audio.AudioClassifier.createFromOptions(fileset, {
        baseOptions: {
          modelAssetPath: data.modelPath,
          delegate: 'CPU',
        },
        maxResults: 20,
        scoreThreshold: 0.01,
      })
      classifier.setDefaultSampleRate(16000)
      self.postMessage({ type: 'ready' })
      return
    }

    if (data.type === 'dispose') {
      classifier?.close()
      classifier = null
      return
    }

    if (data.type === 'infer') {
      if (!classifier) {
        self.postMessage({ type: 'error', message: 'YAMNet modeli henüz yüklenmedi.' })
        return
      }
      const started = performance.now()
      const results = classifier.classify(data.samples, data.sampleRate)
      const inferMs = Math.round(performance.now() - started)
      self.postMessage({ type: 'result', id: data.id, top: flattenTop(results), inferMs })
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'YAMNet çıkarımı başarısız.'
    self.postMessage({ type: 'error', message })
  }
}
