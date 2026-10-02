// Every network call the app makes lives here.
const DEFAULT_TIMEOUT = 8000

function withTimeout(ms = DEFAULT_TIMEOUT) {
  return typeof AbortSignal !== 'undefined' && AbortSignal.timeout ? AbortSignal.timeout(ms) : undefined
}

function toHttp(url) {
  return url.replace(/^wss?:\/\//, (m) => (m === 'wss://' ? 'https://' : 'http://'))
}

export async function checkAlive(url) {
  if (!url?.trim()) return false
  try {
    const res = await fetch(`${toHttp(url)}`, { signal: withTimeout(5000) })
    return res.ok
  } catch {
    return false
  }
}

export async function checkApiAlive(apiUrl) {
  try {
    const res = await fetch(`${apiUrl}/v1/models/available`, { signal: withTimeout(5000) })
    return res.ok
  } catch {
    return false
  }
}

/** Picks personal node vs. public API for a given request. */
function resolveBase({ apiUrl, nodeUrl, nodeConnected }) {
  if (nodeConnected && nodeUrl?.trim()) return toHttp(nodeUrl)
  return apiUrl
}

const HF_CACHE_KEY = 'tl_hf_models_cache'
const HF_CACHE_TTL = 12 * 60 * 60 * 1000

/**
 * Pulls the most-downloaded text-generation models from Hugging Face's
 * public, unauthenticated models endpoint. Used to populate the "Popular
 * on Hugging Face" tab in the model browser so requesting a model doesn't
 * require already knowing an exact HF model ID. Results are cached in
 * localStorage for a few hours since this is a public, fairly static
 * ranking and there's no reason to hit HF on every render.
 */
export async function fetchPopularHFModels(limit = 40) {
  try {
    const cached = JSON.parse(localStorage.getItem(HF_CACHE_KEY) || 'null')
    if (cached && Array.isArray(cached.data) && Date.now() - cached.ts < HF_CACHE_TTL) {
      return cached.data
    }
  } catch {
    // corrupt/missing cache entry — just refetch
  }

  try {
    const res = await fetch(
      `https://huggingface.co/api/models?sort=downloads&direction=-1&limit=${limit}&filter=text-generation`,
      { signal: withTimeout(6000) }
    )
    if (!res.ok) throw new Error(`Hugging Face API failed (${res.status})`)
    const data = await res.json()
    const list = data.map((m) => ({
      id: m.id ?? m.modelId,
      name: m.id ?? m.modelId,
      downloads: m.downloads ?? 0,
      likes: m.likes ?? 0,
    }))
    try {
      localStorage.setItem(HF_CACHE_KEY, JSON.stringify({ ts: Date.now(), data: list }))
    } catch {
      // localStorage full/unavailable — non-fatal, just skip caching
    }
    return list
  } catch (err) {
    console.warn('fetchPopularHFModels failed:', err)
    return []
  }
}

export async function fetchModels({ apiUrl, nodeUrl, nodeConnected }) {
  try {
    const base = resolveBase({ apiUrl, nodeUrl, nodeConnected })
    const res = await fetch(`${base}/v1/models/available`, { signal: withTimeout() })
    if (!res.ok) throw new Error(`Failed to load models (${res.status})`)
    const data = await res.json()
    const list = Array.isArray(data) ? data : data.active_models || data.models || data.data || []
    return list.map((m) => (typeof m === 'string' ? { id: m, name: m } : { id: m.id ?? m.name, name: m.name ?? m.id, requires_tensorlink: !!m.requires_tensorlink }))
  } catch (err) {
    console.warn('fetchModels failed, using fallback list:', err)
    return [{ id: 'local-echo', name: 'Local Echo (offline fallback)' }]
  }
}

export async function fetchNetworkHistory(apiUrl, days = 30) {
  const res = await fetch(`${apiUrl}/network-history?days=${days}`, { signal: withTimeout() })
  if (!res.ok) throw new Error(`Failed to load network history (${res.status})`)
  return res.json()
}

export async function fetchModelDemand(apiUrl) {
  const res = await fetch(`${apiUrl}/v1/models/demand`, { signal: withTimeout() })
  if (!res.ok) throw new Error(`Failed to load model demand (${res.status})`)
  return res.json()
}

export async function fetchNodeStats(apiUrl) {
  const res = await fetch(`${apiUrl}/stats`, { signal: withTimeout() })
  if (!res.ok) throw new Error(`Failed to load network stats (${res.status})`)
  return res.json()
}

export async function requestModel(apiUrl, modelName, minutes) {
  try {
    const res = await fetch(`${apiUrl}/v1/models/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        hf_name: modelName,
        model_type: "chat",
        time: minutes,
        payment: 0
      }),
      signal: withTimeout(10000),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) return { success: false, message: data.message || `Request failed (${res.status})` }
    return { success: true, message: data.message || 'Model requested — it will appear once resources free up.' }
  } catch (err) {
    return { success: false, message: err.message || 'Failed to reach the network.' }
  }
}

/**
 * Streams a chat completion, calling onDelta(fullTextSoFar) as tokens
 * arrive. Falls back to a canned local response if nothing is reachable,
 * so the UI always has something to show rather than hanging forever.
 *
 * Pass `{ signal }` (from an AbortController) to let the caller cancel an
 * in-flight generation — e.g. a "Stop" button. Note this currently only
 * cancels the client's read of the stream / drops the connection; it does
 * NOT yet tell the node/API to stop computing server-side. Once a
 * cancellation endpoint exists on the backend (e.g. DELETE
 * /v1/chat/completions/:id), call it here before/after aborting so the
 * node can free the compute immediately instead of just losing its client.
 */
export async function streamChat(
  { apiUrl, nodeUrl, nodeConnected, model, messages, temperature, maxTokens },
  onDelta,
  { signal } = {}
) {
  const base = resolveBase({ apiUrl, nodeUrl, nodeConnected })

  if (model === 'local-echo') {
    const last = messages[messages.length - 1]?.content ?? ''
    const reply = `_(offline fallback — no model connected)_\n\nYou said: "${last}"`
    onDelta(reply)
    return reply
  }

  const res = await fetch(`${base}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: messages.map(({ role, content }) => ({ role, content })),
      temperature,
      max_tokens: maxTokens,
      stream: true,
    }),
    signal,
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.message || body.error || `Request failed (${res.status})`)
  }
  if (!res.body) {
    const data = await res.json()
    const text = data.choices?.[0]?.message?.content ?? ''
    onDelta(text)
    return text
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let full = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed.startsWith('data:')) continue
      const payload = trimmed.slice(5).trim()
      if (!payload || payload === '[DONE]') continue
      try {
        const json = JSON.parse(payload)
        const delta = json.choices?.[0]?.delta?.content ?? json.choices?.[0]?.text ?? ''
        if (delta) {
          full += delta
          onDelta(full)
        }
      } catch {
        // Ignore malformed / partial SSE chunks — the next read() call
        // will complete them.
      }
    }
  }

  return full
}
