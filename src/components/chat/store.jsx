import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

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

const DEFAULT_SETTINGS = {
  model: '',
  temperature: 0.7,
  maxTokens: 1024,
}

/**
 * Everything the app needs to remember lives here, entirely in the
 * browser's localStorage — chats, messages, model preferences, and the
 * optional personal Tensorlink node URL. Nothing is ever sent anywhere
 * except the chat request itself (see api.js), which goes either to your
 * own node or the public Tensorlink API, whichever you've chosen.
 */
export function StoreProvider({ children }) {
  const [chats, setChats] = useState(() => load('tl_chats', []))
  const [activeChatId, setActiveChatIdState] = useState(() => localStorage.getItem('tl_active_chat') || '')
  const [settings, setSettingsState] = useState(() => ({ ...DEFAULT_SETTINGS, ...load('tl_settings', {}) }))
  const [nodeUrl, setNodeUrlState] = useState(() => localStorage.getItem('tl_node_url') || '')
  const [apiUrl, setApiUrlState] = useState(
    () => localStorage.getItem('tl_api_url') || 'https://tensorlink.ddns.net/tensorlink'
  )
  const [view, setViewState] = useState(() => localStorage.getItem('tl_view') || 'home')

  useEffect(() => persist('tl_chats', chats), [chats])
  useEffect(() => localStorage.setItem('tl_active_chat', activeChatId), [activeChatId])
  useEffect(() => persist('tl_settings', settings), [settings])
  useEffect(() => localStorage.setItem('tl_view', view), [view])

  const setView = useCallback((v) => setViewState(v), [])

  const activeChat = useMemo(() => chats.find((c) => c.id === activeChatId) || null, [chats, activeChatId])

  const createChat = useCallback(() => {
    const chat = { id: uid(), title: 'New chat', messages: [], createdAt: Date.now(), lastEditTime: Date.now() }
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
              title: c.messages.length === 0 && message.role === 'user' ? message.content.slice(0, 42) : c.title,
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

  const removeMessagesFrom = useCallback((chatId, index) => {
    setChats((prev) => prev.map((c) => (c.id === chatId ? { ...c, messages: c.messages.slice(0, index) } : c)))
  }, [])

  const setSettings = useCallback((patch) => setSettingsState((prev) => ({ ...prev, ...patch })), [])

  const connectNode = useCallback((url) => {
    localStorage.setItem('tl_node_url', url)
    setNodeUrlState(url)
  }, [])

  const disconnectNode = useCallback(() => {
    localStorage.removeItem('tl_node_url')
    setNodeUrlState('')
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
      settings,
      setSettings,
      nodeUrl,
      connectNode,
      disconnectNode,
      apiUrl,
      setApiUrl,
      view,
      setView,
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
      settings,
      setSettings,
      nodeUrl,
      connectNode,
      disconnectNode,
      apiUrl,
      setApiUrl,
      view,
      setView,
    ]
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within a StoreProvider')
  return ctx
}
