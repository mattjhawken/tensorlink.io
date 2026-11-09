// Every network call the app makes lives here.
const DEFAULT_TIMEOUT = 8000

function withTimeout(ms = DEFAULT_TIMEOUT) {
  return typeof AbortSignal !== 'undefined' && AbortSignal.timeout ? AbortSignal.timeout(ms) : undefined
}

export function toHttp(url) {
  return (url || '')
    .trim()
    .replace(/^wss?:\/\//, (m) => (m === 'wss://' ? 'https://' : 'http://'))
    .replace(/\/+$/, '')
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
  return toHttp(apiUrl)
}

/** Where requests currently go: { kind: 'node' | 'public', base }. */
export function resolveTarget({ apiUrl, nodeUrl }) {
  return nodeUrl?.trim() ? { kind: 'node', base: toHttp(nodeUrl) } : { kind: 'public', base: toHttp(apiUrl) }
}

// ---------------------------------------------------------------------------
// Personal node addressing
// ---------------------------------------------------------------------------

// Port assumed when someone types a bare IP address. Change this if your
// node's HTTP API listens somewhere else.
export const DEFAULT_NODE_PORT = 64747

const IPV4 = /^\d{1,3}(\.\d{1,3}){3}$/

function classifyHost(hostname) {
  const h = hostname.replace(/^\[|\]$/g, '').toLowerCase()
  const isIpv4 = IPV4.test(h)
  const [a, b] = isIpv4 ? h.split('.').map(Number) : []
  const loopback = h === 'localhost' || h === '::1' || (isIpv4 && a === 127)
  const privateLan =
    h.endsWith('.local') ||
    (isIpv4 && (a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 169 && b === 254)))
  const ipLike = isIpv4 || h.includes(':') || loopback || h.endsWith('.local')
  return { loopback, privateLan, ipLike }
}

/**
 * Turns whatever someone types into a node base URL.
 *   "192.168.1.20"            -> http://192.168.1.20:<DEFAULT_NODE_PORT>
 *   "192.168.1.20:8080"       -> http://192.168.1.20:8080
 *   "node.example.com"        -> https://node.example.com
 *   "wss://node.example.com"  -> https://node.example.com
 * Returns { error } or { url, host, loopback, warnings: [{ level, message }] }.
 */
export function parseNodeAddress(input, { pageProtocol } = {}) {
  const raw = (input || '').trim()
  if (!raw) return { error: 'Enter your node’s IP address or URL.' }

  const hasScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(raw)
  let url
  try {
    url = new URL(hasScheme ? toHttp(raw) : `http://${raw}`)
  } catch {
    return { error: 'That doesn’t look like a valid address.' }
  }
  if (!/^https?:$/.test(url.protocol) || !url.hostname) return { error: 'Use an IP address or an http(s) URL.' }

  const host = classifyHost(url.hostname)
  if (!hasScheme) {
    if (host.ipLike) {
      if (!url.port) url.port = String(DEFAULT_NODE_PORT)
    } else {
      url.protocol = 'https:'
    }
  }

  const path = url.pathname.replace(/\/+$/, '')
  const page = pageProtocol ?? (typeof location !== 'undefined' ? location.protocol : 'https:')
  const warnings = []
  if (page === 'https:' && url.protocol === 'http:' && !host.loopback) {
    warnings.push({
      level: 'warn',
      message:
        'This site is served over HTTPS, and most browsers block it from calling a plain http:// address. Put your node behind HTTPS (for example nginx with a certificate) and enter that URL, or use localhost.',
    })
  }
  if (host.privateLan) {
    warnings.push({
      level: 'info',
      message: 'This is a local network address. It only works from a device on the same network as your node.',
    })
  }
  return { url: `${url.origin}${path}`, host: url.host, loopback: host.loopback, warnings }
}

function extractModelList(data) {
  return Array.isArray(data) ? data : data?.active_models ?? data?.models ?? data?.data ?? []
}

/** One health check for a base URL: reachable, how fast, and how many models it lists. */
export async function probeBase(base, timeout = 5000) {
  const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now())
  const started = now()
  try {
    const res = await fetch(`${toHttp(base)}/v1/models/available`, { signal: withTimeout(timeout) })
    const latencyMs = Math.round(now() - started)
    if (!res.ok) return { ok: false, kind: 'http', status: res.status, latencyMs }
    let modelCount = null
    try {
      modelCount = extractModelList(await res.json()).length
    } catch {
      // reachable but not JSON; still counts as up
    }
    return { ok: true, latencyMs, modelCount }
  } catch (err) {
    const timedOut = err?.name === 'TimeoutError' || err?.name === 'AbortError'
    return { ok: false, kind: timedOut ? 'timeout' : 'network' }
  }
}

/** Plain-language reason for a failed probe. A browser can't tell CORS, mixed content and "down" apart. */
export function explainProbe(probe, { node = false } = {}) {
  if (!probe || probe.ok) return ''
  if (probe.kind === 'http') {
    return probe.status === 404
      ? 'The server answered, but it has no /v1/models/available. Check the address and any path prefix.'
      : `The server answered with an error (${probe.status}).`
  }
  if (probe.kind === 'timeout') return 'No response within 5 seconds.'
  return node
    ? 'Couldn’t connect. Check that the node is running and the address is right. The browser also blocks the request if the node doesn’t allow this site (CORS), or if this page is HTTPS and the node is plain HTTP.'
    : 'Couldn’t reach the public API.'
}

const HF_CACHE_KEY = 'tl_hf_models_cache'
const HF_CACHE_TTL = 12 * 60 * 60 * 1000

/**
 * Pulls the most-downloaded text-generation models from Hugging Face's
 * public, unauthenticated models endpoint. Results are cached in
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
    // corrupt/missing cache entry, just refetch
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
      // localStorage full/unavailable, just skip caching
    }
    return list
  } catch (err) {
    console.warn('fetchPopularHFModels failed:', err)
    return []
  }
}

function normalize(v) {
  let n = 0
  for (let i = 0; i < v.length; i++) n += v[i] * v[i]
  n = Math.sqrt(n) || 1
  const out = new Float32Array(v.length)
  for (let i = 0; i < v.length; i++) out[i] = v[i] / n
  return out
}

export async function embedTexts({ provider, apiUrl, nodeUrl }, texts, inputType = 'passage', { timeout = 20000 } = {}) {
  const base = provider === 'node' ? toHttp(nodeUrl) : apiUrl
  const res = await fetch(`${base}/v1/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ input: texts, input_type: inputType }),
    signal: withTimeout(timeout),
  })
  if (!res.ok) throw new Error(`Embeddings request failed (${res.status})`)
  const json = await res.json()
  const rows = [...(json.data || [])].sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
  if (rows.length !== texts.length) throw new Error('Embeddings response did not match the request')
  return { model: json.model || 'default', vectors: rows.map((r) => normalize(r.embedding)) }
}

function toModel(entry, meta = {}) {
  const obj = typeof entry === 'object' && entry ? entry : {}
  const id = typeof entry === 'string' ? entry : entry.id ?? entry.name
  const m = { ...meta, ...obj }
  const gd = m.generation_defaults || {}
  return {
    id,
    name: m.display_name ?? m.name ?? id,
    type: m.type,
    requires_tensorlink: !!m.requires_tensorlink,
    supports_reasoning: m.supports_reasoning,
    supports_web_search: m.supports_web_search,
    contextLength: m.context_length,
    defaults: { temperature: gd.temperature, topP: gd.top_p },
  }
}

export async function fetchModelsFrom(base) {
  const res = await fetch(`${toHttp(base)}/v1/models/available`, { signal: withTimeout() })
  if (!res.ok) throw new Error(`Failed to load models (${res.status})`)
  const data = await res.json()

  const metaById = new Map(
    (Array.isArray(data?.models) ? data.models : [])
      .filter((m) => m && typeof m === 'object')
      .map((m) => [m.id ?? m.name, m])
  )
  return extractModelList(data).map((e) => toModel(e, metaById.get(typeof e === 'string' ? e : e.id ?? e.name)))
}

export async function fetchModels({ apiUrl, nodeUrl, nodeConnected }) {
  try {
    return await fetchModelsFrom(resolveBase({ apiUrl, nodeUrl, nodeConnected }))
  } catch (err) {
    console.warn('fetchModels failed, using fallback list:', err)
    return [{ id: 'local-echo', name: 'Local Echo (offline fallback)', defaults: {} }]
  }
}

export async function fetchNetworkHistory(apiUrl, days = 30) {
  const res = await fetch(`${apiUrl}/network-history?days=${days}&include_device=true`, { signal: withTimeout() })
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

/** The three dashboard panels for one base URL. Any panel a server doesn't serve comes back null. */
export async function fetchMetrics(base) {
  const b = toHttp(base)
  const [history, demand, stats] = await Promise.all([
    fetchNetworkHistory(b, 90).catch(() => null),
    fetchModelDemand(b).catch(() => null),
    fetchNodeStats(b).catch(() => null),
  ])
  return { history, demand, stats }
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
    return { success: true, message: data.message || 'Model requested, it will appear once resources free up.' }
  } catch (err) {
    return { success: false, message: err.message || 'Failed to reach the network.' }
  }
}

/**
 * Streams a chat completion, calling onDelta(fullTextSoFar) as tokens
 * arrive. Falls back to a canned local response if nothing is reachable,
 * so the UI always has something to show rather than hanging forever.
 */
export async function streamChat(
  { apiUrl, nodeUrl, nodeConnected, model, messages, temperature, topP, maxTokens, features },
  onDelta,
  { signal } = {}
) {
  const base = resolveBase({ apiUrl, nodeUrl, nodeConnected })

  if (model === 'local-echo') {
    const last = messages[messages.length - 1]?.content ?? ''
    const reply = `_(offline fallback, no model connected)_\n\nYou said: "${last}"`
    onDelta(reply)
    return reply
  }

  const requestBody = {
    model,
    messages: messages.map(({ role, content }) => ({ role, content })),
    temperature,
    max_tokens: maxTokens,
    stream: true,
    ...(topP != null && { top_p: topP }),
    ...(features?.reasoning && { reasoning: true }),
    ...(features?.webSearch && { web_search: true }),
  };

  console.log('[streamChat] POST /v1/chat/completions');
  console.log('[streamChat] Full API request:', requestBody);

  const res = await fetch(`${base}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
    signal,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.message || body.error || `Request failed (${res.status})`)
  }
  if (!res.body) {
    const data = await res.json()
    const text = data.choices?.[0]?.message?.content ?? ''
    const thought = data.choices?.[0]?.message?.reasoning_content ?? ''
    onDelta(text, thought)
    return text
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let full = ''
  let reasoning = ''

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
        const d = json.choices?.[0]?.delta
        const delta = d?.content ?? json.choices?.[0]?.text ?? ''
        if (delta.includes('\uFFFD')) console.warn('[stream] replacement char from server:', JSON.stringify(delta))
        const thought = d?.reasoning_content ?? d?.reasoning ?? ''
        if (thought) reasoning += thought
        if (delta) full += delta
        if (delta || thought) onDelta(full, reasoning)
      } catch {
        // Ignore malformed / partial SSE chunks
      }
    }
  }

  return full
}
