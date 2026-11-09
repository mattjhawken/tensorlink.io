import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MdAdd,
  MdDelete,
  MdMenu,
  MdSearch,
  MdMoreHoriz,
  MdPushPin,
  MdOutlinePushPin,
  MdContentCopy,
  MdEdit,
  MdCheck,
} from 'react-icons/md'
import SidebarShell from '../../components/navigation/SidebarShell.jsx'
import { useStore } from './store.jsx'
import { IconButton } from './ui.jsx'
import { blurFade } from '../../transitions'
import ConnectionMenu from './ConnectionMenu.jsx'
import { ROUTES } from './routes.js'
import { useRagIndexer } from './rag/useRag.js'

const MENU_WIDTH = 190

function formatDate(ms) {
  if (!ms) return ''
  const d = new Date(ms)
  const today = new Date()
  const sameDay = d.toDateString() === today.toDateString()
  return sameDay
    ? d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function chatToText(chat) {
  return chat.messages
    .filter((m) => m.role !== 'system')
    .map((m) => `${m.role === 'user' ? 'You' : 'Assistant'}: ${m.content}`)
    .join('\n\n')
}

function MenuItem({ icon: Icon, label, onClick, hint, danger, armed }) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-sm transition-colors ${
        armed
          ? 'bg-red-400/15 text-red-300 ring-1 ring-red-400/40'
          : danger
            ? 'text-red-400 hover:bg-red-400/10'
            : 'text-[#C5CAD6] hover:bg-white/[0.06]'
      }`}
    >
      <Icon size={15} className="shrink-0" />
      <span className="flex-1">{label}</span>
      {hint && (
        <span
          className={`rounded border px-1.5 py-0.5 text-[10px] ${
            armed ? 'border-red-400/30 bg-red-400/15 text-red-300' : 'border-white/10 bg-white/5 font-mono text-[#5B6272]'
          }`}
        >
          {hint}
        </span>
      )}
    </button>
  )
}

export default function ChatShell() {
  const { chats, activeChatId, createChat, deleteChat, selectChat, renameChat, togglePinChat, view, setView, setDashSection } = useStore()
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 640)
  const [sidebarTab, setSidebarTab] = useState('chats')
  const [searchQuery, setSearchQuery] = useState('')
  const [menu, setMenu] = useState(null)
  const [pendingDeleteId, setPendingDeleteId] = useState(null)
  const [copiedId, setCopiedId] = useState(null)
  const [renamingId, setRenamingId] = useState(null)
  const [renameDraft, setRenameDraft] = useState('')
  const contentRef = useRef(null)
  const menuRef = useRef(null)
  const cancelRenameRef = useRef(false)

  useRagIndexer() // keeps the chat-history search index in sync (no-op unless enabled)

  const resetScroll = useCallback(() => {
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const closeMenu = useCallback(() => {
    setMenu(null)
    setPendingDeleteId(null)
    setCopiedId(null)
  }, [])

  const handleNewChat = useCallback(() => {
    createChat()
    resetScroll()
    setView('chat')
    setSidebarTab('chats')
    if (window.innerWidth < 640) setSidebarOpen(false)
  }, [createChat, resetScroll, setView])

  const openDashboard = useCallback(
    (section) => {
      if (section) setDashSection(section)
      setView('dashboard')
    },
    [setDashSection, setView]
  )

  // The dashboard launches pages; chat starts a fresh conversation, everything else just opens.
  const handleLaunch = useCallback(
    (id) => (id === 'chat' ? handleNewChat() : setView(id)),
    [handleNewChat, setView]
  )

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

  // Pinned chats float to the top; within each group, newest edit first.
  const filteredChats = useMemo(() => {
    const sorted = [...chats].sort((a, b) => {
      if (!!b.pinned !== !!a.pinned) return b.pinned ? 1 : -1
      return (b.lastEditTime || 0) - (a.lastEditTime || 0)
    })
    if (!searchQuery.trim()) return sorted
    const q = searchQuery.toLowerCase()
    return sorted.filter((c) => c.title.toLowerCase().includes(q))
  }, [chats, searchQuery])

  const menuChat = menu ? chats.find((c) => c.id === menu.chatId) : null
  const Page = (ROUTES.find((r) => r.id === view) ?? ROUTES.find((r) => r.id === 'dashboard')).component

  const openMenu = (e, chatId) => {
    e.stopPropagation()
    if (menu?.chatId === chatId) {
      closeMenu()
      return
    }
    const rect = e.currentTarget.getBoundingClientRect()
    setPendingDeleteId(null)
    setCopiedId(null)
    setMenu({ chatId, top: rect.bottom + 4, left: Math.max(8, rect.right - MENU_WIDTH) })
  }

  const startRename = (chat) => {
    closeMenu()
    cancelRenameRef.current = false
    setRenameDraft(chat.title || '')
    setRenamingId(chat.id)
  }

  const commitRename = (id) => {
    if (cancelRenameRef.current) {
      cancelRenameRef.current = false
      return
    }
    const title = renameDraft.trim()
    if (title) renameChat(id, title)
    setRenamingId(null)
  }

  const handleCopyChat = async (chat) => {
    try {
      await navigator.clipboard.writeText(chatToText(chat))
      setCopiedId(chat.id)
      setTimeout(closeMenu, 900)
    } catch (err) {
      console.warn('Copy failed:', err)
      closeMenu()
    }
  }

  useEffect(() => {
    try {
      localStorage.setItem('tl_used_app', '1')
    } catch {
    }
  }, [])

  // While the menu is open: D arms the delete item, Enter confirms it,
  // Esc backs out one level (disarm first, then close the menu).
  useEffect(() => {
    if (!menu) return
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        if (pendingDeleteId) setPendingDeleteId(null)
        else closeMenu()
        return
      }
      if (pendingDeleteId) {
        if (e.key === 'Enter') {
          e.preventDefault() // also stops Enter from re-clicking the focused button
          deleteChat(pendingDeleteId)
          closeMenu()
        }
        return
      }
      if (e.key === 'd' || e.key === 'D') {
        e.preventDefault()
        setPendingDeleteId(menu.chatId)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [menu, pendingDeleteId, deleteChat, closeMenu])

  // Click outside the menu closes it.
  useEffect(() => {
    if (!menu) return
    const onMouseDown = (e) => {
      if (menuRef.current?.contains(e.target)) return
      if (e.target.closest?.('[data-chat-menu-trigger]')) return
      closeMenu()
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [menu, closeMenu])

  // If the chat disappears out from under an open menu, close it.
  useEffect(() => {
    if (menu && !menuChat) closeMenu()
  }, [menu, menuChat, closeMenu])

  return (
    <div className="h-full w-full flex overflow-hidden bg-[#0A0D13] text-[#EDEFF4] relative">
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/60 z-30 sm:hidden" />
      )}

      {/* Sidebar (shared with the landing page layout) */}
      <SidebarShell
        open={sidebarOpen}
        tab={sidebarTab}
        onTabChange={(t) => {
          closeMenu()
          setSidebarTab(t)
        }}
        onScroll={() => menu && closeMenu()}
        chatsContent={
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
                {ROUTES.filter((r) => r.nav).map((r) => (
                  <IconButton
                    key={r.id}
                    onClick={() => setView(view === r.id ? 'chat' : r.id)}
                    title={r.label}
                    className={view === r.id ? 'text-[#4FD8C4] border-[#4FD8C4]/40' : ''}
                  >
                    <r.icon size={16} />
                  </IconButton>
                ))}
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
                  {filteredChats.map((chat) => {
                    const menuOpen = menu?.chatId === chat.id
                    return (
                      <li key={chat.id} className="group relative">
                        {renamingId === chat.id ? (
                          <div className="px-1.5 py-1.5">
                            <input
                              autoFocus
                              value={renameDraft}
                              onFocus={(e) => e.target.select()}
                              onChange={(e) => setRenameDraft(e.target.value)}
                              onBlur={() => commitRename(chat.id)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault()
                                  commitRename(chat.id)
                                } else if (e.key === 'Escape') {
                                  e.preventDefault()
                                  cancelRenameRef.current = true
                                  setRenamingId(null)
                                }
                              }}
                              maxLength={80}
                              className="w-full rounded-md border border-[#4FD8C4]/40 bg-white/[0.04] px-2 py-1 text-sm text-[#EDEFF4] focus:outline-none focus:ring-2 focus:ring-[#4FD8C4]/40"
                            />
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => handleSelectChat(chat.id)}
                              className={`w-full text-left px-2.5 py-2 pr-9 rounded-lg transition-colors ${
                                pendingDeleteId === chat.id
                                  ? 'ring-1 ring-red-400/50 bg-red-400/[0.06]'
                                  : chat.id === activeChatId && view === 'chat'
                                    ? 'bg-white/10'
                                    : menuOpen
                                      ? 'bg-white/5'
                                      : 'hover:bg-white/5'
                              }`}
                            >
                              <div className="flex items-center gap-1.5 min-w-0">
                                {chat.pinned && <MdPushPin size={12} className="shrink-0 text-[#4FD8C4]" />}
                                <p className="text-sm font-medium truncate text-[#EDEFF4]">{chat.title || 'New chat'}</p>
                              </div>
                              <p className="text-xs text-[#5B6272]">{formatDate(chat.lastEditTime)}</p>
                            </button>
                            <button
                              data-chat-menu-trigger
                              onClick={(e) => openMenu(e, chat.id)}
                              title="Chat options"
                              aria-haspopup="menu"
                              aria-expanded={menuOpen}
                              className={`absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-[#8B93A7] transition-opacity hover:bg-white/10 hover:text-[#EDEFF4] focus:opacity-100 ${
                                menuOpen ? 'opacity-100 bg-white/10 text-[#EDEFF4]' : 'sm:opacity-0 sm:group-hover:opacity-100'
                              }`}
                            >
                              <MdMoreHoriz size={18} />
                            </button>
                          </>
                        )}
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </>
        }
      />

      {/* Chat options menu (fixed-position) */}
      {menu && menuChat && (
        <div
          ref={menuRef}
          role="menu"
          style={{ top: menu.top, left: menu.left, width: MENU_WIDTH }}
          className="fixed z-50 rounded-lg border border-white/10 bg-[#12151c] p-1.5 shadow-xl shadow-black/40"
        >
          <MenuItem
            icon={menuChat.pinned ? MdPushPin : MdOutlinePushPin}
            label={menuChat.pinned ? 'Unpin' : 'Pin'}
            onClick={() => {
              togglePinChat(menuChat.id)
              closeMenu()
            }}
          />
          <MenuItem
            icon={copiedId === menuChat.id ? MdCheck : MdContentCopy}
            label={copiedId === menuChat.id ? 'Copied!' : 'Copy chat'}
            onClick={() => handleCopyChat(menuChat)}
          />
          <MenuItem icon={MdEdit} label="Rename" onClick={() => startRename(menuChat)} />
          <div className="my-1 h-px bg-white/10" />
          <MenuItem
            icon={MdDelete}
            label={pendingDeleteId === menuChat.id ? 'Delete?' : 'Delete'}
            danger
            armed={pendingDeleteId === menuChat.id}
            hint={pendingDeleteId === menuChat.id ? 'Enter ↵' : 'D'}
            onClick={() => {
              closeMenu()
              handleDeleteChat(menuChat.id)
            }}
          />
        </div>
      )}

      {/* Main content */}
      <motion.div
        {...blurFade}
        ref={contentRef}
        className={`flex-1 h-full overflow-y-auto relative transition-[margin] duration-300 ${sidebarOpen ? 'sm:ml-[270px]' : 'ml-0'}`}
      >
        <div className="flex items-center justify-between gap-3 p-1 sm:p-2 border-b border-white/10 bg-[#0A0D13] sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <IconButton onClick={() => setSidebarOpen((o) => !o)} title="Toggle sidebar">
              <MdMenu size={16} />
            </IconButton>
            <span className="text-sm font-medium text-[#9AA2B4]">tensorlink</span>
          </div>
          <ConnectionMenu onOpenDashboard={openDashboard} />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            <Page routes={ROUTES} onLaunch={handleLaunch} onNavigateToSettings={() => openDashboard('chat')} />
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
