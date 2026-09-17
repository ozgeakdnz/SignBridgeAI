import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { defineConfig } from 'vite'

function copyMediapipeWasm() {
  return {
    name: 'copy-mediapipe-wasm',
    buildStart() {
      if (existsSync('public/mediapipe/audio/audio_bundle.js')) return
      spawnSync('node', ['scripts/copy-mediapipe-wasm.mjs'], { stdio: 'inherit' })
    },
  }
}

export default defineConfig({
  plugins: [copyMediapipeWasm(), react(), tailwindcss()],
  worker: {
    format: 'es',
  },
})
