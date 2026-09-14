import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { MdAdd, MdDelete, MdSettings, MdHome, MdMenu, MdSearch, MdChatBubbleOutline, MdMenuBook } from 'react-icons/md'
import Sidebar from '../../components/navigation/Sidebar.jsx';
import { useStore } from './store.jsx'
import { checkApiAlive, checkAlive } from './api.js'
import { StatusDot, IconButton } from './ui.jsx'
import Chat from './Chat.jsx'
import Home from './Home.jsx'
import Settings from './Settings.jsx'

const POLL_INTERVAL_MS = 60_000

function formatDate(ms) {
  if (!ms) return ''
  const d = new Date(ms)
  const today = new Date()
  const sameDay = d.toDateString() === today.toDateString()
  return sameDay
    ? d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function NodeStatusPill({ onOpenSettings }) {
  const { apiUrl, nodeUrl } = useStore()
  const [apiStatus, setApiStatus] = useState('checking')
  const [nodeStatus, setNodeStatus] = useState('disconnected')

  const poll = useCallback(async () => {
    setApiStatus('checking')
    setApiStatus((await checkApiAlive(apiUrl)) ? 'connected' : 'disconnected')
    if (nodeUrl) {
      setNodeStatus('checking')
      setNodeStatus((await checkAlive(nodeUrl)) ? 'connected' : 'disconnected')
    } else {
      setNodeStatus('disconnected')
    }
  }, [apiUrl, nodeUrl])

  useEffect(() => {
    poll()
    const id = setInterval(poll, POLL_INTERVAL_MS)
    return () => clearInterval(id)
  }, [poll])

  const overall = apiStatus === 'connected' || nodeStatus === 'connected' ? 'connected' : apiStatus === 'checking' || nodeStatus === 'checking' ? 'checking' : 'disconnected'
  const label = nodeUrl && nodeStatus === 'connected' ? 'Private node' : overall === 'connected' ? 'Connected' : overall === 'checking' ? 'Checking…' : 'Offline'

  return (
    <button
      onClick={onOpenSettings}
      className="flex items-center gap-2 rounded-full border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-[#9AA2B4] transition-colors hover:border-gray-300 dark:hover:border-white/20"
      title="Connection status — click to manage in Settings"
    >
      <StatusDot status={overall} />
      <span className="hidden sm:inline">{label}</span>
    </button>
  )
}

// Segmented control switching the sidebar between chat history and the
// docs nav. Kept as its own component since both tab buttons share the
// same active/inactive styling logic.
function SidebarTabs({ tab, onChange }) {
  const tabs = [
    { id: 'chats', label: 'Chats', icon: MdChatBubbleOutline },
    { id: 'docs', label: 'Docs', icon: MdMenuBook },
  ]
  return (
    <div className="mx-3 mb-3 flex rounded-lg border border-white/10 bg-white/[0.02] p-1">
      {tabs.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-colors ${
            tab === id ? 'bg-[#4FD8C4]/15 text-[#4FD8C4]' : 'text-[#8B93A7] hover:text-[#EDEFF4]'
          }`}
        >
          <Icon size={14} />
          {label}
        </button>
      ))}
    </div>
  )
}

export default function ChatShell() {
  const { chats, activeChatId, createChat, deleteChat, selectChat, view, setView } = useStore()
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 640)
  const [sidebarTab, setSidebarTab] = useState('chats')
  const [searchQuery, setSearchQuery] = useState('')
  const [hoveredChatId, setHoveredChatId] = useState(null)
  const [pendingDeleteId, setPendingDeleteId] = useState(null)
  const contentRef = useRef(null)

  const resetScroll = useCallback(() => {
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const handleNewChat = useCallback(() => {
    createChat()
    resetScroll()
    setView('chat')
    setSidebarTab('chats')
    if (window.innerWidth < 640) setSidebarOpen(false)
  }, [createChat, resetScroll, setView])

  const handleDeleteChat = useCallback(
    (id) => {
      if (!window.confirm('Delete this chat? This cannot be undone.')) return
      deleteChat(id)
    },
    [deleteChat]
  )

  const handleSelectChat = useCallback(
    (id) => {
      selectChat(id)
      setView('chat')
      resetScroll()
      if (window.innerWidth < 640) setSidebarOpen(false)
    },
    [selectChat, setView, resetScroll]
  )

  const filteredChats = useMemo(() => {
    const sorted = [...chats].sort((a, b) => (b.lastEditTime || 0) - (a.lastEditTime || 0))
    if (!searchQuery.trim()) return sorted
    const q = searchQuery.toLowerCase()
    return sorted.filter((c) => c.title.toLowerCase().includes(q))
  }, [chats, searchQuery])

  // Keyboard shortcut: hover a chat row, press D to arm it for deletion
  // (a small "D" badge shows this is available), then Enter to confirm —
  // no mouse trip to the delete icon + confirm dialog required. After a
  // delete, the "cursor" moves to the chat that slides into the same
  // spot, so pressing D -> Enter again immediately chain-deletes down
  // the list.
  useEffect(() => {
    const onKeyDown = (e) => {
      const tag = document.activeElement?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return

      if (pendingDeleteId) {
        if (e.key === 'Enter') {
          e.preventDefault()
          const idx = filteredChats.findIndex((c) => c.id === pendingDeleteId)
          deleteChat(pendingDeleteId)
          const next = filteredChats[idx + 1] || filteredChats[idx - 1] || null
          setHoveredChatId(next?.id || null)
          setPendingDeleteId(null)
        } else if (e.key === 'Escape') {
          setPendingDeleteId(null)
        }
        return
      }

      if ((e.key === 'd' || e.key === 'D') && hoveredChatId) {
        e.preventDefault()
        setPendingDeleteId(hoveredChatId)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [pendingDeleteId, hoveredChatId, filteredChats, deleteChat])

  return (
    <div className="h-full w-full flex overflow-hidden bg-[#0A0D13] text-[#EDEFF4] relative">
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/60 z-30 sm:hidden" />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed z-40 h-full w-[270px] shrink-0 overflow-y-auto border-r border-white/10 bg-[#0d1017] transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="px-4 pt-5 pb-4">
          <Link to="/" className="text-lg font-bold text-[#EDEFF4] hover:text-[#4FD8C4] transition-colors">
            tensorlink.io
          </Link>
        </div>

        <SidebarTabs tab={sidebarTab} onChange={setSidebarTab} />

        {sidebarTab === 'chats' ? (
          <>
            <div className="flex items-center justify-between gap-2 px-3 pb-3">
              <div className="flex gap-1.5">
                <IconButton onClick={handleNewChat} title="New chat" className="text-[#4FD8C4] border-[#4FD8C4]/30 hover:border-[#4FD8C4]/50">
                  <MdAdd size={16} />
                </IconButton>
                <IconButton
                  onClick={() => handleDeleteChat(activeChatId)}
                  disabled={!activeChatId}
                  title="Delete current chat"
                  className="text-red-400 border-red-400/20 hover:border-red-400/40"
                >
                  <MdDelete size={16} />
                </IconButton>
              </div>
              <div className="flex gap-1.5">
                <IconButton onClick={() => setView(view === 'settings' ? 'chat' : 'settings')} title="Settings" className={view === 'settings' ? 'text-[#4FD8C4] border-[#4FD8C4]/40' : ''}>
                  <MdSettings size={16} />
                </IconButton>
                <IconButton onClick={() => setView(view === 'home' ? 'chat' : 'home')} title="Home" className={view === 'home' ? 'text-[#4FD8C4] border-[#4FD8C4]/40' : ''}>
                  <MdHome size={16} />
                </IconButton>
              </div>
            </div>

            {/* Search */}
            <div className="px-3 pb-2">
              <div className="relative">
                <MdSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" size={15} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search chats..."
                  className="w-full rounded-lg border border-white/10 bg-white/[0.03] pl-8 pr-3 py-1.5 text-sm text-[#EDEFF4] placeholder:text-[#5B6272] focus:outline-none focus:ring-2 focus:ring-[#4FD8C4]/40"
                />
              </div>
            </div>

            {/* Chat list */}
            <div className="px-2 pb-4">
              {filteredChats.length === 0 ? (
                <p className="px-2.5 py-6 text-center text-xs text-[#5B6272]">
                  {searchQuery ? 'No chats found' : 'No chats yet — start a new conversation.'}
                </p>
              ) : (
                <ul className="space-y-0.5">
                  {filteredChats.map((chat) => (
                    <li
                      key={chat.id}
                      onMouseEnter={() => setHoveredChatId(chat.id)}
                      onMouseLeave={() => {
                        setHoveredChatId((id) => (id === chat.id ? null : id))
                        setPendingDeleteId((id) => (id === chat.id ? null : id))
                      }}
                    >
                      <button
                        onClick={() => handleSelectChat(chat.id)}
                        className={`w-full text-left px-2.5 py-2 rounded-lg transition-colors ${
                          pendingDeleteId === chat.id
                            ? 'ring-1 ring-red-400/50 bg-red-400/[0.06]'
                            : chat.id === activeChatId && view === 'chat'
                              ? 'bg-white/10'
                              : 'hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate text-[#EDEFF4]">{chat.title || 'New chat'}</p>
                            <p className="text-xs text-[#5B6272]">{formatDate(chat.lastEditTime)}</p>
                          </div>
                          {pendingDeleteId === chat.id ? (
                            <span className="shrink-0 rounded-md border border-red-400/30 bg-red-400/15 px-1.5 py-0.5 text-[10px] font-medium text-red-300">
                              Enter to delete
                            </span>
                          ) : (
                            hoveredChatId === chat.id && (
                              <span className="shrink-0 rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-mono text-[#5B6272]">
                                D
                              </span>
                            )
                          )}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        ) : (
          <Sidebar embedded />
        )}
      </aside>

      {/* Main content */}
      <div
        ref={contentRef}
        className={`flex-1 h-full overflow-y-auto relative transition-[margin] duration-300 ${sidebarOpen ? 'sm:ml-[270px]' : 'ml-0'}`}
      >
        <div className="flex items-center justify-between gap-3 p-3 border-b border-white/10 bg-[#0A0D13] sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <IconButton onClick={() => setSidebarOpen((o) => !o)} title="Toggle sidebar">
              <MdMenu size={16} />
            </IconButton>
            <span className="text-sm font-medium text-[#9AA2B4]">tensorlink</span>
          </div>
          <NodeStatusPill onOpenSettings={() => setView('settings')} />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            {view === 'home' && <Home onStartChat={handleNewChat} onNavigateToSettings={() => setView('settings')} />}
            {view === 'settings' && <Settings onBack={() => setView('chat')} />}
            {view === 'chat' && <Chat onNavigateToSettings={() => setView('settings')} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
