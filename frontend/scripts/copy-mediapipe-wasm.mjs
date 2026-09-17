import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const pkg = join(root, 'node_modules/@mediapipe/tasks-audio')
const destDir = join(root, 'public/mediapipe/audio')
const wasmSrc = join(pkg, 'wasm')
const bundleSrc = join(pkg, 'audio_bundle.js')

if (!existsSync(wasmSrc) || !existsSync(bundleSrc)) {
  console.warn('MediaPipe audio paket dosyaları bulunamadı; önce npm install çalıştırın.')
  process.exit(0)
}

mkdirSync(destDir, { recursive: true })
cpSync(wasmSrc, join(destDir, 'wasm'), { recursive: true })
cpSync(bundleSrc, join(destDir, 'audio_bundle.js'))

const patchTag = 'globalThis.ModuleFactory = ModuleFactory'
for (const name of ['audio_wasm_internal.js', 'audio_wasm_nosimd_internal.js']) {
  const file = join(destDir, 'wasm', name)
  if (!existsSync(file)) continue
  const src = readFileSync(file, 'utf8')
  if (src.includes(patchTag)) continue
  writeFileSync(file, `${src}\nif (typeof globalThis !== 'undefined') globalThis.ModuleFactory = ModuleFactory;\n`)
}

console.log('MediaPipe audio wasm + bundle kopyalandı → public/mediapipe/audio')
