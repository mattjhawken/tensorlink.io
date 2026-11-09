// IndexedDB storage for the chat-history search index. Two stores:
//   chunks:  { id, chatId, title, ts, text, hash }          — what we search over
//   vectors: { key: `${model}|${chunkId}`, chunkId, chatId, vec: Int8Array }
// Vectors are keyed by embedding model, so switching embedders (node ->
// in-browser, say) never mixes vector spaces and never destroys the old
// vectors — retrieval simply only looks at the current model's rows.

const DB_NAME = 'tl_rag'
const VERSION = 1
let dbPromise = null

function open() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, VERSION)
      req.onupgradeneeded = () => {
        const db = req.result
        db.createObjectStore('chunks', { keyPath: 'id' }).createIndex('chatId', 'chatId')
        db.createObjectStore('vectors', { keyPath: 'key' }).createIndex('chunkId', 'chunkId')
      }
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => {
        dbPromise = null
        reject(req.error)
      }
    })
  }
  return dbPromise
}

const wrap = (req) =>
  new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })

const finished = (tx) =>
  new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })

const modelRange = (model) => IDBKeyRange.bound(`${model}|`, `${model}|\uffff`)

export async function getAllChunks() {
  const db = await open()
  return wrap(db.transaction('chunks').objectStore('chunks').getAll())
}

export async function putChunks(rows) {
  if (!rows.length) return
  const db = await open()
  const tx = db.transaction('chunks', 'readwrite')
  const store = tx.objectStore('chunks')
  rows.forEach((r) => store.put(r))
  await finished(tx)
}

export async function deleteVectorsFor(chunkIds) {
  if (!chunkIds.length) return
  const db = await open()
  const tx = db.transaction('vectors', 'readwrite')
  const store = tx.objectStore('vectors')
  const idx = store.index('chunkId')
  for (const id of chunkIds) {
    const req = idx.getAllKeys(id)
    req.onsuccess = () => req.result.forEach((k) => store.delete(k))
  }
  await finished(tx)
}

export async function deleteChunks(ids) {
  if (!ids.length) return
  const db = await open()
  const tx = db.transaction('chunks', 'readwrite')
  const store = tx.objectStore('chunks')
  ids.forEach((id) => store.delete(id))
  await finished(tx)
  await deleteVectorsFor(ids)
}

export async function putVectors(model, rows) {
  if (!rows.length) return
  const db = await open()
  const tx = db.transaction('vectors', 'readwrite')
  const store = tx.objectStore('vectors')
  rows.forEach((r) => store.put({ key: `${model}|${r.chunkId}`, chunkId: r.chunkId, chatId: r.chatId, vec: r.vec }))
  await finished(tx)
}

/** Set of chunk ids that already have a vector for `model`. */
export async function getVectorChunkIds(model) {
  const db = await open()
  const keys = await wrap(db.transaction('vectors').objectStore('vectors').getAllKeys(modelRange(model)))
  const prefix = `${model}|`.length
  return new Set(keys.map((k) => k.slice(prefix)))
}

export async function getVectors(model) {
  const db = await open()
  return wrap(db.transaction('vectors').objectStore('vectors').getAll(modelRange(model)))
}

export async function clearAll() {
  const db = await open()
  const tx = db.transaction(['chunks', 'vectors'], 'readwrite')
  tx.objectStore('chunks').clear()
  tx.objectStore('vectors').clear()
  await finished(tx)
}
