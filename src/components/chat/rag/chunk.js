// Turns a chat into searchable chunks. A chunk is one user turn plus the
// assistant's reply (question + answer retrieve far better together than
// apart). Long exchanges are split into overlapping windows of ~1200 chars
// (roughly 250–300 tokens). System messages, empty replies and our own
// "couldn't reach a model" error messages are skipped.

const MAX_CHARS = 1200
const OVERLAP = 150
const ERROR_PREFIX = "Sorry — I couldn't reach a model"

export function fnv1a(str) {
  let h = 0x811c9dc5
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(16)
}

function split(text) {
  if (text.length <= MAX_CHARS) return [text]
  const parts = []
  for (let i = 0; i < text.length; i += MAX_CHARS - OVERLAP) {
    parts.push(text.slice(i, i + MAX_CHARS))
    if (i + MAX_CHARS >= text.length) break
  }
  return parts
}

export function chunkChat(chat) {
  const msgs = chat.messages || []
  const out = []
  let i = 0
  while (i < msgs.length) {
    const m = msgs[i]
    if (m.role !== 'user' || !m.content?.trim()) {
      i++
      continue
    }
    let j = i + 1
    const replies = []
    while (j < msgs.length && msgs[j].role !== 'user') {
      const c = msgs[j].content?.trim()
      if (msgs[j].role === 'assistant' && c && !c.startsWith(ERROR_PREFIX)) replies.push(c)
      j++
    }
    if (replies.length) {
      const text = `User: ${m.content.trim()}\n\nAssistant: ${replies.join('\n\n')}`
      split(text).forEach((part, p) =>
        out.push({
          id: `${chat.id}:${m.id ?? i}:${p}`,
          chatId: chat.id,
          title: chat.title || 'Untitled chat',
          ts: m.timestamp ?? chat.lastEditTime ?? 0,
          text: part,
          hash: fnv1a(part),
        })
      )
    }
    i = j
  }
  return out
}
