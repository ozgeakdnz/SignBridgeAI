import { YAMNET_SAMPLE_RATE } from './soundClasses'

const WORKLET_SOURCE = `
class RadarCaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super()
    this._buf = new Float32Array(4096)
    this._n = 0
  }
  process(inputs) {
    const ch = inputs[0] && inputs[0][0]
    if (!ch) return true
    for (let i = 0; i < ch.length; i++) {
      this._buf[this._n++] = ch[i]
      if (this._n === this._buf.length) {
        this.port.postMessage(this._buf.slice())
        this._n = 0
      }
    }
    return true
  }
}
registerProcessor('radar-capture', RadarCaptureProcessor)
`

export function downsampleTo16k(input: Float32Array, inputRate: number): Float32Array {
  if (inputRate === YAMNET_SAMPLE_RATE) return input
  if (inputRate <= 0 || input.length === 0) return input
  const ratio = inputRate / YAMNET_SAMPLE_RATE
  const outLen = Math.max(1, Math.floor(input.length / ratio))
  const out = new Float32Array(outLen)
  for (let i = 0; i < outLen; i++) {
    const x = i * ratio
    const i0 = Math.min(Math.floor(x), input.length - 1)
    const i1 = Math.min(i0 + 1, input.length - 1)
    const f = x - i0
    out[i] = input[i0] * (1 - f) + input[i1] * f
  }
  return out
}

export function rms(samples: Float32Array): number {
  if (samples.length === 0) return 0
  let sum = 0
  for (let i = 0; i < samples.length; i++) sum += samples[i] * samples[i]
  return Math.sqrt(sum / samples.length)
}

export type CaptureHandle = {
  context: AudioContext
  stop: () => void
}

export async function startMicCapture(
  onPcm: (samples16k: Float32Array) => void,
): Promise<CaptureHandle> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      channelCount: 1,
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
    },
    video: false,
  })

  const context = new AudioContext()
  await context.resume()
  const source = context.createMediaStreamSource(stream)
  const mute = context.createGain()
  mute.gain.value = 0

  let stopped = false
  const deliver = (raw: Float32Array) => {
    if (stopped) return
    onPcm(downsampleTo16k(raw, context.sampleRate))
  }

  let disconnect = () => undefined as void

  try {
    const blob = new Blob([WORKLET_SOURCE], { type: 'application/javascript' })
    const url = URL.createObjectURL(blob)
    await context.audioWorklet.addModule(url)
    URL.revokeObjectURL(url)
    const node = new AudioWorkletNode(context, 'radar-capture')
    node.port.onmessage = (ev: MessageEvent<Float32Array>) => deliver(ev.data)
    source.connect(node)
    node.connect(mute)
    mute.connect(context.destination)
    disconnect = () => {
      node.port.onmessage = null
      node.disconnect()
    }
  } catch {
    const bufferSize = 4096
    const processor = context.createScriptProcessor(bufferSize, 1, 1)
    processor.onaudioprocess = (ev) => {
      deliver(ev.inputBuffer.getChannelData(0).slice())
    }
    source.connect(processor)
    processor.connect(mute)
    mute.connect(context.destination)
    disconnect = () => {
      processor.onaudioprocess = null
      processor.disconnect()
    }
  }

  return {
    context,
    stop() {
      stopped = true
      disconnect()
      source.disconnect()
      mute.disconnect()
      stream.getTracks().forEach((t) => t.stop())
      void context.close()
    },
  }
}
