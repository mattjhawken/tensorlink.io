import {
  ActionButtonsRow,
  NodeStatusButton,
  ChatPreviewList,
  SettingsView,
  HomeView,
  Interface
} from './components'
import { useRef, useState, useCallback } from 'react'


// Define possible app views
type AppView = 'home' | 'chat' | 'settings' | 'fine-tuning'

const App = () => {
  const contentContainerRef = useRef<HTMLDivElement>(null)
  
  const [currentView, setCurrentViewStorage] = useState<AppView>(() => {
    return (localStorage.getItem('appView') as AppView) ?? 'chat'
  })
  const [chatListKey, setChatListKey] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [scrollToRequestModel, setScrollToRequestModel] = useState(false)

  const setCurrentView: React.Dispatch<React.SetStateAction<AppView>> =
    useCallback((value) => {
      setCurrentViewStorage(prev => {
        const next =
          typeof value === 'function'
            ? (value as (prev: AppView) => AppView)(prev)
            : value

        localStorage.setItem('appView', next)
        return next
    })
  }, [])

  const resetScroll = () => {
    contentContainerRef.current?.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  const refreshChatList = useCallback(() => {
    setChatListKey(prev => prev + 1)
  }, [])

  // Handler for when a chat is selected
  const handleChatSelect = useCallback(() => {
    setCurrentView('chat') // Switch to chat view
    resetScroll()
    setSidebarOpen(false)
  }, [])

  // Navigate to Settings → Request Model section from the chat dropdown
  const handleNavigateToRequestModel = useCallback(() => {
    setScrollToRequestModel(true)
    setCurrentView('settings')
    resetScroll()
    // Reset flag after a short delay so re-navigation works again
    setTimeout(() => setScrollToRequestModel(false), 800)
  }, [])

  return (
    <div className="h-full w-full flex overflow-hidden bg-zinc-800 text-white relative">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 z-30 md:hidden"
        />
      )}

      {/* Sidebar - hidden on home page */}
      <aside
        className={`
          fixed z-40
          h-full bg-zinc-900
          w-[260px] shrink-0 overflow-y-auto
          border-r border-white/10
          transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="mb-4 mx-3 pt-5">
          <h2 className="text-lg sm:text-xl font-bold">tensorlink.io</h2>
        </div>

        <ActionButtonsRow
          className="action-row flex items-center px-1"
          currentView={currentView}
          setCurrentView={setCurrentView}
          resetScroll={resetScroll}
          onChatChange={refreshChatList}
        />

        <div>
          <div className="p-4 sm:p-6 text-center text-white/70 text-sm sm:text-base">
            Select a chat or start a new conversation
          </div>

          <ChatPreviewList
            key={chatListKey}
            className="mt-2 space-y-1 px-2"
            onSelect={handleChatSelect}
          />
        </div>
      </aside>

      {/* Main Content */}
      <div
        ref={contentContainerRef}
        className={`
          flex-1 h-full overflow-y-auto relative bg-zinc-900/90
          transition-[margin] duration-300
          ${sidebarOpen ? 'md:ml-[260px]' : 'md:ml-0'}
        `}
      >
        {/* Mobile header - hidden on home page */}
        <div className="flex items-center justify-between gap-3 p-3 border-b border-white/10 bg-zinc-900">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="pb-1 px-2 rounded-md bg-zinc-800"
            >
              ☰
            </button>
            <span className="text-md font-medium">tensorlink</span>
          </div>
          <NodeStatusButton />
        </div>

        {
          currentView === 'home' && <HomeView 
            onStartChat={() => {
              setCurrentView('chat')
              resetScroll()
            }}
            onNavigateToRequestModel={handleNavigateToRequestModel}
          />
        }
        {currentView === 'settings' && <SettingsView scrollToRequestModel={scrollToRequestModel} />}
        {currentView === 'chat' && <Interface key={chatListKey} onNavigateToSettings={handleNavigateToRequestModel} />}
      </div>
    </div>
  )
}

export default App
