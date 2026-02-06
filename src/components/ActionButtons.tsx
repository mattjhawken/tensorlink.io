import { useState, useRef, useEffect } from 'react'
import type { ComponentProps } from 'react'
import { FaRegTrashCan, FaFileContract, FaInfo, FaCircle, FaChevronDown } from 'react-icons/fa6'
import { twMerge } from 'tailwind-merge'
import { useChats } from '../hooks/useChats'

type ActionButtonProps = ComponentProps<'button'> & {
  title?: string
}

type AppView = 'home' | 'chat' | 'settings' | 'fine-tuning'

export const HomeButton = ({
  currentView,
  setCurrentView
}: {
  currentView: AppView
  setCurrentView: React.Dispatch<React.SetStateAction<AppView>>
}) => {
  return (
    <div className="relative group">
      <button
        onClick={() => setCurrentView(currentView === 'home' ? 'chat' : 'home')}
        className={`rounded-md transition-all duration-200 hover:scale-110 active:scale-95 ${
          currentView === 'home' ? 'bg-purple-600' : 'bg-zinc-800 hover:bg-gray-600'
        }`}
      >
        <FaInfo className="w-4 h-4 text-white" />
      </button>
      <span className="hidden sm:block absolute left-1/2 transform -translate-x-1/2 bottom-full mb-2 opacity-0 transition-opacity group-hover:opacity-100 text-white text-xs rounded px-2 py-1 whitespace-nowrap bg-zinc-900 shadow-lg border border-white/10">
        Info
      </span>
    </div>
  )
}

export const FineTuneButton = ({
  currentView,
  setCurrentView
}: {
  currentView: AppView
  setCurrentView: React.Dispatch<React.SetStateAction<AppView>>
}) => {
  return (
    <div className="relative group">
      <button
        onClick={() => setCurrentView(currentView === 'fine-tuning' ? 'chat' : 'fine-tuning')}
        className={`p-0.5 rounded-md transition-all duration-200 hover:scale-110 active:scale-95 ${
          currentView === 'fine-tuning' ? 'bg-purple-600' : 'bg-gray-700 hover:bg-gray-600'
        }`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      </button>
      <span className="hidden sm:block absolute left-1/2 transform -translate-x-1/2 bottom-full mb-2 opacity-0 transition-opacity group-hover:opacity-100 text-white text-xs rounded px-2 py-1 whitespace-nowrap bg-zinc-900 shadow-lg border border-white/10">
        Learn
      </span>
    </div>
  )
}

export const SettingsButton = ({
  currentView,
  setCurrentView
}: {
  currentView: AppView
  setCurrentView: React.Dispatch<React.SetStateAction<AppView>>
}) => {
  return (
    <div className="relative group">
      <button
        onClick={() => setCurrentView(currentView === 'settings' ? 'chat' : 'settings')}
        className={`p-0 rounded-md transition-all duration-200 hover:scale-110 active:scale-95 ${
          currentView === 'settings' ? 'bg-blue-600' : 'bg-zinc-800 hover:bg-gray-600'
        }`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </button>
      <span className="hidden sm:block absolute left-1/2 transform -translate-x-1/2 bottom-full mb-2 opacity-0 transition-opacity group-hover:opacity-100 text-white text-xs rounded px-2 py-1 whitespace-nowrap bg-zinc-900 shadow-lg border border-white/10">
        Settings
      </span>
    </div>
  )
}

export const ActionButton = ({ className, children, title, ...props }: ActionButtonProps) => {
  return (
    <button
      className={twMerge(
        'inline-flex shrink-0 items-center justify-center leading-none mr-1 rounded-md relative group transition-all duration-200 hover:scale-110 active:scale-95 min-w-[28px] min-h-[28px]',
        className
      )}
      {...props}
    >
      {children}
      {title && (
        <span className="hidden sm:block absolute left-1/2 transform -translate-x-1/2 bottom-full mb-2 opacity-0 transition-opacity group-hover:opacity-100 text-white text-xs rounded px-1 py-1 whitespace-nowrap bg-zinc-900 shadow-lg border border-white/10">
          {title}
        </span>
      )}
    </button>
  )
}

export const NewChatButton = ({ 
  resetScroll, 
  onChatChange, 
  ...props 
}: ActionButtonProps & { resetScroll?: () => void; onChatChange?: () => void }) => {
  const { createEmptyChat } = useChats()

  const handleCreation = () => {
    createEmptyChat()
    resetScroll?.()
    onChatChange?.()
  }

  return (
    <ActionButton
      onClick={handleCreation}
      {...props}
      title="New Chat"
      className="bg-green-600 hover:bg-green-500 border-green-600"
    >
      <FaFileContract className="w-4 h-4 text-white" />
    </ActionButton>
  )
}

export const DeleteChatButton = ({
  resetScroll,
  onChatChange,
  ...props
}: ActionButtonProps & { resetScroll?: () => void; onChatChange?: () => void }) => {
  const { deleteChat } = useChats();

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this chat? This action cannot be undone.')) {
      deleteChat()
      resetScroll?.()
      onChatChange?.()
    }
  }

  return (
    <ActionButton
      onClick={handleDelete}
      {...props}
      title="Delete Chat"
      className="bg-red-600 hover:bg-red-500 border-red-500"
    >
      <FaRegTrashCan className="w-4 h-4 text-zinc-300" />
    </ActionButton>
  )
}

export const ActionButtonsRow = ({
  className,
  currentView,
  setCurrentView,
  resetScroll,
  onChatChange,
  ...props
}: ComponentProps<'div'> & {
  currentView: AppView
  setCurrentView: React.Dispatch<React.SetStateAction<AppView>>
  resetScroll: () => void
  onChatChange?: () => void
}) => {
  return (
    <div
      className={twMerge(
        'flex justify-between items-center gap-1 pb-3 border-b border-white/10',
        className
      )}
      {...props}
    >
      <div className="flex space-x-1 ml-1">
        <NewChatButton resetScroll={resetScroll} onChatChange={onChatChange} />
        <DeleteChatButton resetScroll={resetScroll} onChatChange={onChatChange} />
      </div>

      <div className="flex space-x-1 ml-1">
        <SettingsButton currentView={currentView} setCurrentView={setCurrentView} />
        <HomeButton currentView={currentView} setCurrentView={setCurrentView} />
      </div>
    </div>
  )
}

type NodeStatus = 'connected' | 'disconnected' | 'connecting'

export const NodeStatusButton = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [nodeStatus, setNodeStatus] = useState<NodeStatus>('disconnected')
  const [customNodeUrl, setCustomNodeUrl] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleConnect = () => {
    if (!customNodeUrl.trim()) return
    
    setNodeStatus('connecting')
    
    // Simulate connection attempt
    setTimeout(() => {
      // Replace with actual connection logic
      setNodeStatus('connected')
      setIsOpen(false)
    }, 1500)
  }

  const handleDisconnect = () => {
    setNodeStatus('disconnected')
    setCustomNodeUrl('')
  }

  const getStatusColor = () => {
    switch (nodeStatus) {
      case 'connected':
        return 'text-green-500'
      case 'connecting':
        return 'text-yellow-500'
      case 'disconnected':
        return 'text-red-500'
    }
  }

  const getStatusText = () => {
    switch (nodeStatus) {
      case 'connected':
        return 'Connected'
      case 'connecting':
        return 'Connecting...'
      case 'disconnected':
        return 'Disconnected'
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Status Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-md bg-zinc-800 hover:bg-zinc-700 transition-colors text-sm"
      >
        <FaCircle className={`w-2 h-2 ${getStatusColor()} ${nodeStatus === 'connecting' ? 'animate-pulse' : ''}`} />
        <span className="text-sm hidden sm:inline">{getStatusText()}</span>
        <FaChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-zinc-800 border border-white/10 rounded-lg shadow-xl z-50">
          <div className="p-4">
            <div className="mb-3">
              <h3 className="text-sm font-semibold mb-1">Node Status</h3>
              <div className="flex items-center gap-2 text-xs text-white/70">
                <FaCircle className={`w-2 h-2 ${getStatusColor()}`} />
                <span>{getStatusText()}</span>
              </div>
            </div>

            <div className="border-t border-white/10 pt-3 mb-3">
              <label className="block text-xs font-medium mb-2">
                Connect to Personal Node
              </label>
              <input
                type="text"
                value={customNodeUrl}
                onChange={(e) => setCustomNodeUrl(e.target.value)}
                placeholder="wss://your-node-url.com"
                className="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                disabled={nodeStatus === 'connecting' || nodeStatus === 'connected'}
              />
            </div>

            <div className="flex gap-2">
              {nodeStatus === 'connected' ? (
                <button
                  onClick={handleDisconnect}
                  className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-500 text-white text-sm rounded-md transition-colors"
                >
                  Disconnect
                </button>
              ) : (
                <button
                  onClick={handleConnect}
                  disabled={!customNodeUrl.trim() || nodeStatus === 'connecting'}
                  className="flex-1 px-3 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white text-sm rounded-md transition-colors"
                >
                  {nodeStatus === 'connecting' ? 'Connecting...' : 'Connect'}
                </button>
              )}
            </div>

            {nodeStatus === 'connected' && customNodeUrl && (
              <div className="mt-3 p-2 bg-zinc-900 rounded-md">
                <p className="text-xs text-white/50 break-all">{customNodeUrl}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
