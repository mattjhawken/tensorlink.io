// In-browser embedder (option B). Runs transformers.js in a Web Worker so
// model download + inference never block the UI. The model (~25 MB,
// quantized) is fetched from Hugging Face on first use and cached by the
// browser; after that, nothing here touches the network.
//
//   npm i @huggingface/transformers
import { pipeline } from '@huggingface/transformers'

const MODEL = 'Xenova/all-MiniLM-L6-v2' // 384-dim, mean-pooled, no query/passage prefixes needed
let extractor = null

async function getExtractor() {
  if (!extractor) {
    extractor = await pipeline('feature-extraction', MODEL, {
      dtype: 'q8',
      progress_callback: (p) => self.postMessage({ type: 'progress', p }),
    })
  }
  return extractor
}

self.onmessage = async ({ data }) => {
  const { id, texts } = data
  try {
    const ex = await getExtractor()
    const out = await ex(texts, { pooling: 'mean', normalize: true })
    self.postMessage({ id, vectors: out.tolist() })
  } catch (err) {
    self.postMessage({ id, error: err?.message || String(err) })
  }
}
