import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { fetchModels, probeBase, resolveTarget } from './api.js'

const StoreContext = createContext(null)

const uid = () =>
  crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function persist(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // localStorage can throw in private-browsing / quota-exceeded situations;
    // the app should keep working in-memory rather than crash.
  }
}

export const FEATURE_DEFAULTS = { reasoning: false, webSearch: false, rag: false }

export function resolveFeatures(overrides, defaults) {
  const out = {}
  for (const k of Object.keys(FEATURE_DEFAULTS)) {
    out[k] = overrides?.[k] ?? defaults?.[k] ?? FEATURE_DEFAULTS[k]
  }
  return out
}

// Old builds had separate 'home' and 'settings' pages; both now live in the dashboard.
const LEGACY_VIEWS = { home: 'dashboard', settings: 'dashboard' }

const IDLE_CONN = { status: 'disconnected', latencyMs: null, modelCount: null, error: null }
const toConn = (p) => ({
  status: p.ok ? 'connected' : 'disconnected',
  latencyMs: p.latencyMs ?? null,
  modelCount: p.modelCount ?? null,
  error: p.ok ? null : p,
})

const DEFAULT_SETTINGS = {
  model: '',
  features: { ...FEATURE_DEFAULTS },
  ragEnabled: false, // master switch for chat-history retrieval
  temperature: 0.7,
  maxTokens: 1024,
  topP: 1.0
}

/**
 * Everything the app needs to remember lives here, entirely in the
 * browser's localStorage: chats, messages, model preferences, and the
 * optional personal Tensorlink node URL.
 */
export function StoreProvider({ children }) {
  const [chats, setChats] = useState(() => load('tl_chats', []))
  const [activeChatId, setActiveChatIdState] = useState(() => localStorage.getItem('tl_active_chat') || '')
  const [settings, setSettingsState] = useState(() => ({ ...DEFAULT_SETTINGS, ...load('tl_settings', {}) }))
  // `nodeUrl` is the custom API address (a personal node), or '' to use the public API at `apiUrl`.
  // An earlier build could switch a saved node off by storing tl_node_enabled = '0'; that means "public".
  const [nodeUrl, setNodeUrl] = useState(() =>
    localStorage.getItem('tl_node_enabled') === '0' ? '' : localStorage.getItem('tl_node_url') || ''
  )
  const [apiUrl, setApiUrlState] = useState(
    () => localStorage.getItem('tl_api_url') || 'https://tensorlink.ddns.net/tensorlink'
  )
  const [view, setViewState] = useState(() => {
    const saved = localStorage.getItem('tl_view') || 'dashboard'
    return LEGACY_VIEWS[saved] ?? saved
  })
  const [dashSection, setDashSectionState] = useState(() => localStorage.getItem('tl_dash_section') || 'overview')
  const [models, setModels] = useState([])
  const [connection, setConnection] = useState({ ...IDLE_CONN, status: 'checking' })
  const probeSeq = useRef(0)
  const lastBase = useRef(null)

  const target = useMemo(() => resolveTarget({ apiUrl, nodeUrl }), [apiUrl, nodeUrl])

  useEffect(() => persist('tl_chats', chats), [chats])
  useEffect(() => localStorage.setItem('tl_active_chat', activeChatId), [activeChatId])
  useEffect(() => persist('tl_settings', settings), [settings])
  useEffect(() => localStorage.setItem('tl_view', view), [view])
  useEffect(() => localStorage.setItem('tl_dash_section', dashSection), [dashSection])
  useEffect(() => {
    let cancelled = false
    fetchModels({ apiUrl, nodeUrl, nodeConnected: !!nodeUrl }).then((list) => {
      if (cancelled) return
      setModels(list)
      // Pick a model when none is saved yet. When requests move to a different place (node <-> public,
      // or a new node address) and the saved model isn't served there, move to one that is.
      const real = list.filter((m) => m.id !== 'local-echo')
      const targetChanged = lastBase.current !== null && lastBase.current !== target.base
      lastBase.current = target.base
      setSettingsState((prev) => {
        if (prev.model && !(targetChanged && real.length && !real.some((m) => m.id === prev.model))) return prev
        const pick = real[0] ?? list[0]
        return pick ? { ...prev, ...selectPatch(pick) } : prev
      })
    })
    
    return () => {
      cancelled = true
    }
  }, [apiUrl, nodeUrl])

  const setView = useCallback((v) => setViewState(v), [])
  const setDashSection = useCallback((id) => setDashSectionState(id), [])

  // One shared health check of wherever requests are going (menu, dashboard, connection page).
  const recheck = useCallback(async () => {
    const seq = ++probeSeq.current
    setConnection((c) => ({ ...c, status: 'checking' }))
    const probe = await probeBase(target.base)
    if (seq !== probeSeq.current) return
    setConnection(toConn(probe))
  }, [target.base])

  useEffect(() => {
    recheck()
    const id = setInterval(recheck, 60_000)
    return () => clearInterval(id)
  }, [recheck])

  const activeChat = useMemo(() => chats.find((c) => c.id === activeChatId) || null, [chats, activeChatId])

  const createChat = useCallback((features = {}) => {
    const chat = { id: uid(), title: 'New chat', messages: [], features, createdAt: Date.now(), lastEditTime: Date.now() }
    setChats((prev) => [chat, ...prev])
    setActiveChatIdState(chat.id)
    return chat
  }, [])

  const deleteChat = useCallback(
    (id) => {
      const target = id || activeChatId
      if (!target) return
      setChats((prev) => prev.filter((c) => c.id !== target))
      setActiveChatIdState((prev) => (prev === target ? '' : prev))
    },
    [activeChatId]
  )

  const selectChat = useCallback((id) => setActiveChatIdState(id), [])

  const addMessage = useCallback((chatId, message) => {
    setChats((prev) =>
      prev.map((c) =>
        c.id === chatId
          ? {
              ...c,
              messages: [...c.messages, message],
              lastEditTime: Date.now(),
              title: c.messages.length === 0 && message.role === 'user' && c.title === 'New chat' ? message.content.slice(0, 42) : c.title,
            }
          : c
      )
    )
  }, [])

  const updateMessage = useCallback((chatId, index, patch) => {
    setChats((prev) =>
      prev.map((c) =>
        c.id === chatId ? { ...c, messages: c.messages.map((m, i) => (i === index ? { ...m, ...patch } : m)) } : c
      )
    )
  }, [])
  
  function selectPatch(m) {
    const d = m?.defaults || {}
    return {
      model: m.id,
      ...(d.temperature != null && { temperature: d.temperature }),
      ...(d.topP != null && { topP: d.topP }),
    }
  }

  const removeMessagesFrom = useCallback((chatId, index) => {
    setChats((prev) => prev.map((c) => (c.id === chatId ? { ...c, messages: c.messages.slice(0, index) } : c)))
  }, [])

  const renameChat = useCallback((chatId, title) => {
    setChats((prev) => prev.map((c) => (c.id === chatId ? { ...c, title } : c)))
  }, [])

  const togglePinChat = useCallback((chatId) => {
    setChats((prev) => prev.map((c) => (c.id === chatId ? { ...c, pinned: !c.pinned } : c)))
  }, [])

  const setChatFeature = useCallback((chatId, key, value) => {
    setChats((prev) =>
      prev.map((c) => (c.id === chatId ? { ...c, features: { ...(c.features || {}), [key]: value } } : c))
    )
  }, [])

  const setSettings = useCallback((patch) => setSettingsState((prev) => ({ ...prev, ...patch })), [])

  const selectModel = useCallback((id) => {
    const m = models.find((x) => x.id === id)
    setSettingsState((prev) => ({ ...prev, ...(m ? selectPatch(m) : { model: id }) }))
  }, [models])

  /** Send requests to this address (a personal node) instead of the public API. */
  const connectNode = useCallback((url) => {
    localStorage.setItem('tl_node_url', url)
    localStorage.removeItem('tl_node_enabled')
    setNodeUrl(url)
  }, [])

  /** Go back to the public API. */
  const disconnectNode = useCallback(() => {
    localStorage.removeItem('tl_node_url')
    localStorage.removeItem('tl_node_enabled')
    setNodeUrl('')
  }, [])

  const setApiUrl = useCallback((url) => {
    localStorage.setItem('tl_api_url', url)
    setApiUrlState(url)
  }, [])

  const value = useMemo(
    () => ({
      chats,
      activeChatId,
      activeChat,
      createChat,
      deleteChat,
      selectChat,
      addMessage,
      updateMessage,
      removeMessagesFrom,
      renameChat,
      togglePinChat,
      setChatFeature,
      settings,
      setSettings,
      selectModel,
      nodeUrl,
      connectNode,
      disconnectNode,
      target,
      connection,
      recheck,
      apiUrl,
      setApiUrl,
      view,
      setView,
      dashSection,
      setDashSection,
      models,
    }),
    [
      chats,
      activeChatId,
      activeChat,
      createChat,
      deleteChat,
      selectChat,
      addMessage,
      updateMessage,
      removeMessagesFrom,
      renameChat,
      togglePinChat,
      setChatFeature,
      settings,
      setSettings,
      selectModel,
      nodeUrl,
      connectNode,
      disconnectNode,
      target,
      connection,
      recheck,
      apiUrl,
      setApiUrl,
      view,
      setView,
      dashSection,
      setDashSection,
      models,
    ]
  )
  
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within a StoreProvider')
  return ctx
}
