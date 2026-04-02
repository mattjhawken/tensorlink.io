import {
  NodeStatusButton,
  ChatPreviewList,
  SettingsView,
  HomeView,
  Interface,
  NewChatButton,
  DeleteChatButton,
  SettingsButton,
  HomeButton
} from './components'
import { useRef, useState, useCallback } from 'react'
import { type AppView } from "./types/app"

const App = () => {
  const contentContainerRef = useRef<HTMLDivElement>(null)
  
  const [currentView, setCurrentViewStorage] = useState<AppView>(() => {
    return (localStorage.getItem('appView') as AppView) ?? 'chat'
  })
  const [chatListKey, setChatListKey] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 640)
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
    setCurrentView('chat')
    resetScroll()

    if (window.innerWidth < 640) {
      setSidebarOpen(false)
    }
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
          className="fixed inset-0 bg-black/60 z-30 sm:hidden"
        />
      )}

      {/* Sidebar */}
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

        <div
          className='flex justify-between items-center gap-1 pb-3'
        >
          <div className="flex space-x-1 pl-1">
            <NewChatButton resetScroll={resetScroll} onChatChange={refreshChatList} />
            <DeleteChatButton resetScroll={resetScroll} onChatChange={refreshChatList} />
          </div>

          <div className="flex space-x-1 pl-1">
            <SettingsButton currentView={currentView} setCurrentView={setCurrentView} />
            <HomeButton currentView={currentView} setCurrentView={setCurrentView} />
          </div>
        </div>
        
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
          ${sidebarOpen ? 'sm:ml-[260px]' : 'ml-0'}
        `}
      >
        <div className="flex items-center justify-between gap-3 p-3 border-b border-white/10 bg-zinc-900">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(prev => !prev)}
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
        {currentView === 'settings' && <SettingsView scrollToRequestModel={scrollToRequestModel} handleChatSelect={handleChatSelect} />}
        {currentView === 'chat' && <Interface 
          key={chatListKey} 
          onNavigateToSettings={handleNavigateToRequestModel} 
          resetScroll={resetScroll}
          refreshChatList={refreshChatList}
          currentView={currentView} 
          setCurrentView={setCurrentView}
        />}
      </div>
    </div>
  )
}

export default App
