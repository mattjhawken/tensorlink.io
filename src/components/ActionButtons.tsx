import { useState, useRef, useEffect, useCallback } from 'react'
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
    <ActionButton className="relative group">
      <button
        onClick={() => setCurrentView(currentView === 'home' ? 'chat' : 'home')}
        className={`p-1 rounded-md transition-all duration-200 hover:scale-110 active:scale-95 ${
          currentView === 'home' ? 'bg-purple-600' : 'bg-zinc-800 hover:bg-gray-600'
        }`}
      >
        <FaInfo className="w-4 h-4 text-white" />
      </button>
      <span className="hidden sm:block absolute left-1/2 transform -translate-x-1/2 bottom-full mb-2 opacity-0 transition-opacity group-hover:opacity-100 text-white text-xs rounded px-2 py-1 whitespace-nowrap bg-zinc-900 shadow-lg border border-white/10">
        Info
      </span>
    </ActionButton>
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
    <ActionButton className="relative group">
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
    </ActionButton>
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
    <ActionButton
      className="relative group bg-blue-950"
      onClick={() => setCurrentView(currentView === 'settings' ? 'chat' : 'settings')}
      title="Settings"
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
    </ActionButton>
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

const API_URL = 'https://smartnodes.ddns.net/tensorlink-api'
const POLL_INTERVAL_MS = 60_000 // re-check every 60 s

type ServiceStatus = 'connected' | 'disconnected' | 'checking'

interface StatusRowProps {
  label: string
  status: ServiceStatus
  detail?: string
}

const StatusDot = ({ status }: { status: ServiceStatus }) => {
  const color =
    status === 'connected'
      ? 'text-green-500'
      : status === 'checking'
        ? 'text-yellow-500'
        : 'text-red-500'
  return (
    <FaCircle
      className={`w-2 h-2 shrink-0 ${color} ${status === 'checking' ? 'animate-pulse' : ''}`}
    />
  )
}

const StatusRow = ({ label, status, detail }: StatusRowProps) => (
  <div className="flex items-center justify-between gap-3 py-1">
    <div className="flex items-center gap-2 text-xs text-white/70">
      <StatusDot status={status} />
      <span className="font-medium text-white/90">{label}</span>
    </div>
    <span className="text-xs text-white/50 truncate max-w-[120px]">
      {status === 'checking'
        ? 'Checking…'
        : status === 'connected'
          ? detail ?? 'Online'
          : 'Offline'}
    </span>
  </div>
)

async function checkApiAlive(): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/models`, { signal: AbortSignal.timeout(5000) })
    return res.ok
  } catch {
    return false
  }
}

async function checkNodeAlive(url: string): Promise<boolean> {
  if (!url.trim()) return false
  try {
    // Attempt a plain HTTP GET; for WebSocket URLs swap the scheme
    const httpUrl = url.replace(/^wss?:\/\//, 'https://')
    const res = await fetch(httpUrl, { signal: AbortSignal.timeout(5000) })
    return res.ok
  } catch {
    return false
  }
}

export const NodeStatusButton = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [apiStatus, setApiStatus] = useState<ServiceStatus>('checking')
  const [nodeStatus, setNodeStatus] = useState<ServiceStatus>('disconnected')
  const [customNodeUrl, setCustomNodeUrl] = useState('')
  const [savedNodeUrl, setSavedNodeUrl] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Overall status: connected if either service is up
  const overallConnected = apiStatus === 'connected' || nodeStatus === 'connected'
  const overallChecking = apiStatus === 'checking' || nodeStatus === 'checking'
  const overallStatus: ServiceStatus = overallConnected
    ? 'connected'
    : overallChecking
      ? 'checking'
      : 'disconnected'

  const overallColor =
    overallStatus === 'connected'
      ? 'text-green-500'
      : overallStatus === 'checking'
        ? 'text-yellow-500'
        : 'text-red-500'

  const overallLabel =
    overallStatus === 'connected'
      ? 'Connected'
      : overallStatus === 'checking'
        ? 'Checking…'
        : 'Disconnected'

  // Poll API status
  const pollApi = useCallback(async () => {
    setApiStatus('checking')
    const alive = await checkApiAlive()
    setApiStatus(alive ? 'connected' : 'disconnected')
  }, [])

  // Poll personal node if one is saved
  const pollNode = useCallback(async (url: string) => {
    if (!url) {
      setNodeStatus('disconnected')
      return
    }
    setNodeStatus('checking')
    const alive = await checkNodeAlive(url)
    setNodeStatus(alive ? 'connected' : 'disconnected')
  }, [])

  // Initial + periodic polling
  useEffect(() => {
    pollApi()
    const id = setInterval(pollApi, POLL_INTERVAL_MS)
    return () => clearInterval(id)
  }, [pollApi])

  useEffect(() => {
    const saved = localStorage.getItem('custom_node_url') ?? ''
    setSavedNodeUrl(saved)
    setCustomNodeUrl(saved)
    pollNode(saved)
  }, [pollNode])

  useEffect(() => {
    if (!savedNodeUrl) return
    pollNode(savedNodeUrl)
    const id = setInterval(() => pollNode(savedNodeUrl), POLL_INTERVAL_MS)
    return () => clearInterval(id)
  }, [savedNodeUrl, pollNode])

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [isOpen])

  const handleConnect = () => {
    const url = customNodeUrl.trim()
    if (!url) return
    localStorage.setItem('custom_node_url', url)
    setSavedNodeUrl(url)
    setIsOpen(false)
  }

  const handleDisconnect = () => {
    localStorage.removeItem('custom_node_url')
    setSavedNodeUrl('')
    setCustomNodeUrl('')
    setNodeStatus('disconnected')
  }

  const handleRefresh = () => {
    pollApi()
    if (savedNodeUrl) pollNode(savedNodeUrl)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* ── Pill button ── */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        className="flex items-center gap-2 px-3 py-2 rounded-md bg-zinc-800 hover:bg-zinc-700 transition-colors text-sm"
      >
        <FaCircle
          className={`w-2 h-2 ${overallColor} ${overallStatus === 'checking' ? 'animate-pulse' : ''}`}
        />
        <span className="text-sm hidden sm:inline">{overallLabel}</span>
        <FaChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* ── Dropdown ── */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-zinc-800 border border-white/10 rounded-lg shadow-xl z-50">
          <div className="p-4 space-y-3">

            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Connection Status</h3>
              <button
                onClick={handleRefresh}
                className="!text-xs text-white/50 hover:text-white transition-colors !px-2 !py-0.5 rounded hover:bg-zinc-700"
                title="Refresh"
              >
                ↻ Refresh
              </button>
            </div>

            {/* Service rows */}
            <div className="bg-zinc-900/60 rounded-md px-3 py-1 divide-y divide-white/5">
              <StatusRow label="Tensorlink API" status={apiStatus} detail={API_URL.replace('https://', '')} />
              <StatusRow
                label="Personal Node"
                status={savedNodeUrl ? nodeStatus : 'disconnected'}
                detail={savedNodeUrl || undefined}
              />
            </div>

            {/* Overall badge */}
            <div className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-md ${
              overallConnected ? 'bg-green-900/30 text-green-400' : 'bg-zinc-900/60 text-white/40'
            }`}>
              <FaCircle className={`w-1.5 h-1.5 ${overallConnected ? 'text-green-400' : 'text-white/30'}`} />
              {overallConnected
                ? 'At least one service is reachable'
                : 'No services reachable'}
            </div>

            {/* Personal node input */}
            <div className="border-t border-white/10 pt-3 space-y-2">
              <label className="block text-xs font-medium text-white/70">
                Personal Node URL
              </label>
              <input
                type="text"
                value={customNodeUrl}
                onChange={(e) => setCustomNodeUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
                placeholder="wss://your-node-url.com"
                className="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-white/20"
              />
              <div className="flex gap-2">
                {savedNodeUrl ? (
                  <>
                    <button
                      onClick={handleConnect}
                      className="flex-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-sm rounded-md transition-colors"
                    >
                      Update
                    </button>
                    <button
                      onClick={handleDisconnect}
                      className="flex-1 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-sm rounded-md transition-colors"
                    >
                      Disconnect
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleConnect}
                    disabled={!customNodeUrl.trim()}
                    className="flex-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white text-sm rounded-md transition-colors"
                  >
                    Connect
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}
