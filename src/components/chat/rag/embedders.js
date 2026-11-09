import { embedTexts } from '../api.js'

export const LOCAL_MODEL = 'local:Xenova/all-MiniLM-L6-v2'

let worker = null
let nextId = 0
let progressHandler = null
const pending = new Map()

function failAll(message) {
  pending.forEach((p) => p.reject(new Error(message)))
  pending.clear()
}

function getWorker() {
  if (!worker) {
    worker = new Worker(new URL('./local.worker.js', import.meta.url), { type: 'module' })
    worker.onmessage = ({ data }) => {
      if (data.type === 'progress') {
        progressHandler?.(data.p)
        return
      }
      const p = pending.get(data.id)
      if (!p) return
      pending.delete(data.id)
      if (data.error) p.reject(new Error(data.error))
      else p.resolve(data.vectors.map((v) => Float32Array.from(v)))
    }
    worker.onerror = (e) => failAll(e.message || 'Local embedder crashed')
  }
  return worker
}

export function onLocalProgress(fn) {
  progressHandler = fn
}

export function embedLocal(texts) {
  return new Promise((resolve, reject) => {
    const id = ++nextId
    pending.set(id, { resolve, reject })
    getWorker().postMessage({ id, texts })
  })
}

/** Frees the model's memory when the in-browser embedder is no longer in use. */
export function terminateLocal() {
  if (!worker) return
  worker.terminate()
  worker = null
  failAll('Local embedder stopped')
}

/**
 * provider: 'node' | 'public' | 'local'. Returns { model, vectors: Float32Array[] }
 * with unit-length vectors. 'node' only ever talks to the personal node and
 * 'public' only ever talks to the public API — there is no implicit switching.
 */
export async function embed({ provider, apiUrl, nodeUrl }, texts, inputType = 'passage', opts) {
  if (provider === 'local') return { model: LOCAL_MODEL, vectors: await embedLocal(texts) }
  return embedTexts({ provider, apiUrl, nodeUrl }, texts, inputType, opts)
}
