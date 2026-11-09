import { embed, onLocalProgress, terminateLocal, LOCAL_MODEL } from './embedders.js'
import { chunkChat } from './chunk.js'
import * as db from './db.js'

const BATCH = 24
const MIN_COSINE = 0.3 // tune per embedding model
const K1 = 1.2
const B = 0.75

/* ------------------------------ status store ------------------------------ */

const EMPTY_STATUS = { phase: 'disabled', message: '', done: 0, total: 0, provider: null, model: null, chunks: 0, indexed: 0 }
let status = { ...EMPTY_STATUS }
const listeners = new Set()

function setStatus(patch) {
  status = { ...status, ...patch }
  listeners.forEach((l) => l())
}
export const subscribeStatus = (l) => {
  listeners.add(l)
  return () => listeners.delete(l)
}
export const getStatus = () => status

onLocalProgress((p) => {
  if (p?.status === 'progress' && typeof p.progress === 'number') {
    setStatus({ message: `Downloading model… ${Math.round(p.progress)}%` })
  }
})

/* ------------------------------ provider logic ----------------------------- */

// Which embedder is allowed right now, or null if none.
export function resolveProvider({ nodeUrl, settings }) {
  if (!settings?.ragEnabled) return null
  if (nodeUrl?.trim()) return 'node'
  const e = settings.ragEmbedding || {}
  if (e.fallback === 'public' && e.publicConsent) return 'public'
  if (e.fallback === 'local' && e.localAck) return 'local'
  return null
}

const embedCtx = (provider, ctx) => ({ provider, apiUrl: ctx.apiUrl, nodeUrl: ctx.nodeUrl })
const modelMemo = new Map()

/** The model id the current provider produces (probed once per endpoint). */
async function getModel(provider, ctx) {
  if (provider === 'local') return LOCAL_MODEL
  const key = `${provider}|${provider === 'node' ? ctx.nodeUrl : ctx.apiUrl}`
  if (!modelMemo.has(key)) {
    const { model } = await embed(embedCtx(provider, ctx), ['ping'], 'query', { timeout: 10000 })
    modelMemo.set(key, model)
  }
  return modelMemo.get(key)
}

const withTimeout = (p, ms) =>
  Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))])

/* ------------------------------ in-memory index ---------------------------- */

const STOP = new Set('the a an and or of to in is it for on with as at by be this that i you we are was were'.split(' '))
const tokenize = (s) => (s.toLowerCase().match(/[\p{L}\p{N}_]{2,}/gu) || []).filter((t) => !STOP.has(t))

let textIndex = null // { rows, byId, inv, lens, avgLen }
const vecIndex = new Map() // model -> { ids, mat: Int8Array, dim }

export function invalidateCache() {
  textIndex = null
  vecIndex.clear()
}

async function loadTextIndex() {
  if (textIndex) return textIndex
  const rows = await db.getAllChunks()
  const inv = new Map()
  const lens = new Array(rows.length)
  let total = 0
  rows.forEach((r, i) => {
    const toks = tokenize(r.text)
    lens[i] = toks.length || 1
    total += lens[i]
    const tf = new Map()
    toks.forEach((t) => tf.set(t, (tf.get(t) || 0) + 1))
    tf.forEach((c, t) => {
      let post = inv.get(t)
      if (!post) inv.set(t, (post = []))
      post.push([i, c])
    })
  })
  textIndex = { rows, byId: new Map(rows.map((r, i) => [r.id, i])), inv, lens, avgLen: total / (rows.length || 1) }
  return textIndex
}

async function loadVecIndex(model) {
  if (vecIndex.has(model)) return vecIndex.get(model)
  const all = await db.getVectors(model)
  const dim = all[0]?.vec.length || 0
  const rows = all.filter((r) => r.vec.length === dim)
  const mat = new Int8Array(rows.length * dim)
  rows.forEach((r, i) => mat.set(r.vec, i * dim))
  const idx = { ids: rows.map((r) => r.chunkId), mat, dim }
  vecIndex.set(model, idx)
  return idx
}

export function warmIndex() {
  loadTextIndex().catch(() => {})
}

function vectorSearch(vi, ti, qv, exclude, limit) {
  const { ids, mat, dim } = vi
  if (!ids.length || qv.length !== dim) return []
  const hits = []
  for (let r = 0; r < ids.length; r++) {
    const o = r * dim
    let s = 0
    for (let d = 0; d < dim; d++) s += mat[o + d] * qv[d]
    s /= 127 // vectors are stored as round(v * 127)
    if (s < MIN_COSINE) continue
    const idx = ti.byId.get(ids[r])
    if (idx === undefined || ti.rows[idx].chatId === exclude) continue
    hits.push({ id: ids[r], score: s })
  }
  return hits.sort((a, b) => b.score - a.score).slice(0, limit)
}

function keywordSearch(ti, query, exclude, limit) {
  const terms = [...new Set(tokenize(query))]
  if (!terms.length) return []
  const N = ti.rows.length
  const acc = new Map() // row index -> { s, m }
  for (const t of terms) {
    const post = ti.inv.get(t)
    if (!post) continue
    const idf = Math.log(1 + (N - post.length + 0.5) / (post.length + 0.5))
    for (const [i, tf] of post) {
      const s = (idf * tf * (K1 + 1)) / (tf + K1 * (1 - B + (B * ti.lens[i]) / ti.avgLen))
      const cur = acc.get(i) || { s: 0, m: 0 }
      cur.s += s
      cur.m += 1
      acc.set(i, cur)
    }
  }
  const need = Math.min(2, terms.length) // ignore single-word coincidences
  return [...acc]
    .filter(([i, v]) => v.m >= need && ti.rows[i].chatId !== exclude)
    .sort((a, b) => b[1].s - a[1].s)
    .slice(0, limit)
    .map(([i, v]) => ({ id: ti.rows[i].id, score: v.s }))
}

function rrf(lists, k = 60) {
  const m = new Map()
  lists.forEach((list) => list.forEach((h, rank) => m.set(h.id, (m.get(h.id) || 0) + 1 / (k + rank + 1))))
  return [...m].sort((a, b) => b[1] - a[1]).map(([id]) => id)
}

/* -------------------------------- retrieval -------------------------------- */

// Only the most recent query is cached; the query is embedded once, at send time.
let qCache = { key: '', promise: null }

function queryEmbedding(text, provider, ctx) {
  const key = `${provider}|${text}`
  if (qCache.key !== key) {
    const promise = embed(embedCtx(provider, ctx), [text], 'query', { timeout: 15000 }).then((r) => ({
      model: r.model,
      vec: r.vectors[0],
    }))
    qCache = { key, promise }
    promise.catch(() => {
      if (qCache.key === key) qCache = { key: '', promise: null }
    })
  }
  return qCache.promise
}

// Finds the past-chat excerpts most relevant to `query`. Runs fully in the browser.
export async function retrieve(query, ctx, { excludeChatId, budgetMs = 400, k = 5, maxChars = 4000 } = {}) {
  const provider = resolveProvider(ctx)
  const text = query.trim()
  if (!provider || !text) return { hits: [], mode: 'off' } // feature off or no allowed embedder: zero cost

  const started = performance.now()
  const ti = await loadTextIndex() // cached in memory; only slow on the first call
  if (!ti.rows.length) return { hits: [], mode: 'empty' }

  let q = null
  try {
    // Embed the query, but never wait past the latency budget
    q = await withTimeout(queryEmbedding(text, provider, ctx), Math.max(50, budgetMs - (performance.now() - started)))
  } catch {
    // timed out or endpoint down
  }

  const lists = []
  if (q) {
    const vi = await loadVecIndex(q.model) // only vectors from the same model are comparable
    lists.push(vectorSearch(vi, ti, q.vec, excludeChatId, 20)) // cosine similarity, local
  }
  lists.push(keywordSearch(ti, text, excludeChatId, 20)) // BM25, no network needed

  const hits = []
  const perChat = new Map()
  let chars = 0
  for (const id of rrf(lists)) { // merge both rankings
    const row = ti.rows[ti.byId.get(id)]
    if (!row || (perChat.get(row.chatId) || 0) >= 2) continue // max 2 excerpts per chat
    if (hits.length && chars + row.text.length > maxChars) break // cap prompt size
    perChat.set(row.chatId, (perChat.get(row.chatId) || 0) + 1)
    chars += row.text.length
    hits.push({ id, chatId: row.chatId, title: row.title, ts: row.ts, text: row.text })
    if (hits.length >= k) break
  }
  return { hits, mode: q ? 'hybrid' : 'keyword' }
}

export function formatContext(hits) {
  const body = hits
    .map((h, i) => `[${i + 1}] From "${h.title}" (${new Date(h.ts).toLocaleDateString()}):\n${h.text}`)
    .join('\n\n')
  return `Relevant excerpts from the user's earlier chats. Use them only if they help answer the current message, and don't mention them otherwise.\n\n${body}`
}

/* --------------------------------- indexing -------------------------------- */

const toInt8 = (v) => {
  const out = new Int8Array(v.length)
  for (let i = 0; i < v.length; i++) out[i] = Math.max(-127, Math.min(127, Math.round(v[i] * 127)))
  return out
}
const pause = (ms = 60) => new Promise((r) => setTimeout(r, ms))

let latestCtx = null
let running = false
let again = false
let epoch = 0
let retryTimer = null

async function runOnce(provider) {
  const ctx = latestCtx
  const startEpoch = epoch
  const desired = ctx.chats.flatMap(chunkChat)
  const desiredIds = new Set(desired.map((c) => c.id))
  const existing = await db.getAllChunks()
  const existingById = new Map(existing.map((r) => [r.id, r]))

  const stale = existing.filter((r) => !desiredIds.has(r.id)).map((r) => r.id)
  const textChanged = []
  const upsert = []
  for (const c of desired) {
    const e = existingById.get(c.id)
    if (!e) upsert.push(c)
    else if (e.hash !== c.hash) {
      textChanged.push(c.id)
      upsert.push(c)
    } else if (e.title !== c.title || e.ts !== c.ts) upsert.push(c)
  }
  if (stale.length) await db.deleteChunks(stale)
  if (textChanged.length) await db.deleteVectorsFor(textChanged)
  if (upsert.length) await db.putChunks(upsert)
  if (stale.length || upsert.length) invalidateCache()

  const model = await getModel(provider, ctx)
  const have = await db.getVectorChunkIds(model)
  const missing = desired.filter((c) => !have.has(c.id))
  const baseIndexed = desired.length - missing.length
  setStatus({
    provider,
    model,
    chunks: desired.length,
    indexed: baseIndexed,
    total: missing.length,
    done: 0,
    phase: missing.length ? 'indexing' : 'idle',
    message: missing.length ? 'Indexing…' : '',
  })

  for (let i = 0; i < missing.length; i += BATCH) {
    // Stop if the user disabled search, changed the embedder, or wiped the index mid-run.
    if (epoch !== startEpoch || resolveProvider(latestCtx) !== provider) return
    const batch = missing.slice(i, i + BATCH)
    const { model: m, vectors } = await embed(embedCtx(provider, ctx), batch.map((c) => c.text), 'passage')
    await db.putVectors(m, batch.map((c, j) => ({ chunkId: c.id, chatId: c.chatId, vec: toInt8(vectors[j]) })))
    vecIndex.delete(m)
    const done = i + batch.length
    setStatus({ done, indexed: baseIndexed + done, message: `Indexing ${done} of ${missing.length}…` })
    await pause()
  }
  setStatus({ phase: 'idle', message: '' })
  warmIndex()
}

/**
 * Brings the index in line with ctx.chats (new/edited/deleted chats).
 * ctx = { chats, settings, nodeUrl, apiUrl }. Safe to call often.
 */
export async function reconcile(ctx) {
  latestCtx = ctx
  const provider = resolveProvider(ctx)
  if (!provider) {
    if (!ctx.settings.ragEnabled) setStatus({ phase: 'disabled', provider: null, message: '' })
    else setStatus({ phase: 'paused', provider: null, message: 'Waiting for an embedding source... Connect a personal node or choose a fallback.' })
    terminateLocal()
    return
  }
  if (provider !== 'local') terminateLocal()
  if (running) {
    again = true
    return
  }
  running = true
  clearTimeout(retryTimer)
  try {
    do {
      again = false
      const p = resolveProvider(latestCtx)
      if (!p) break
      await runOnce(p)
    } while (again)
  } catch (err) {
    console.warn('RAG indexing failed:', err)
    setStatus({ phase: 'error', message: err?.message || 'Indexing failed' })
    retryTimer = setTimeout(() => latestCtx && reconcile(latestCtx), 60_000)
  } finally {
    running = false
  }
}

export async function wipeIndex() {
  epoch++
  await db.clearAll()
  invalidateCache()
  modelMemo.clear()
  setStatus({ chunks: 0, indexed: 0, done: 0, total: 0, message: '', phase: latestCtx?.settings?.ragEnabled ? 'idle' : 'disabled' })
}

export async function rebuildIndex(ctx) {
  await wipeIndex()
  await reconcile(ctx)
}
