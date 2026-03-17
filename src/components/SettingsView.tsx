import { useChatSettings } from '../hooks/useChatSettings'
import { useState, useEffect, useRef } from 'react'

// Settings view component
export const SettingsView = ({ 
  scrollToRequestModel,
  handleChatSelect
}: { 
  scrollToRequestModel?: boolean,
  handleChatSelect?: () => void
}) => {
  const {
    availableModels,
    chatSettings,
    setChatSettings,
    isConnectingTensorlink,
    tensorlinkStats,
    connectToTensorlink,
    getTensorlinkStats,
    requestModel,
    refreshModels
  } = useChatSettings()

  const [defaultModel, setDefaultModel] = useState(chatSettings.model)
  const [defaultTemperature, setDefaultTemperature] = useState(chatSettings.temperature)
  const [connectionMessage, setConnectionMessage] = useState('')
  const [showStats, setShowStats] = useState(false)
  const [apiUrl, setApiUrl] = useState('https://smartnodes.ddns.net/tensorlink-api')
  const [requestModelName, setRequestModelName] = useState('')
  const [requestMinutes, setRequestMinutes] = useState(30)
  const [requestModelMessage, setRequestModelMessage] = useState<{ text: string; success: boolean } | null>(null)
  const [isRequestingModel, setIsRequestingModel] = useState(false)
  const requestModelRef = useRef<HTMLDivElement>(null)

  // Update local state when chatSettings changes
  useEffect(() => {
    setDefaultModel(chatSettings.model)
    setDefaultTemperature(chatSettings.temperature)
  }, [chatSettings])

  // Load saved API URL on mount
  useEffect(() => {
    const savedUrl = localStorage.getItem('tensorlink_api_url')
    if (savedUrl) {
      setApiUrl(savedUrl)
    }
  }, [])

  // Scroll to Request Model section if navigated from ChatSettings dropdown
  useEffect(() => {
    if (scrollToRequestModel && requestModelRef.current) {
      setTimeout(() => {
        requestModelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    }
  }, [scrollToRequestModel])

  const handleRequestModel = async () => {
    if (!requestModelName.trim()) return
    setIsRequestingModel(true)
    setRequestModelMessage(null)
    const result = await requestModel(requestModelName.trim(), requestMinutes)
    setRequestModelMessage({ text: result.message, success: result.success })
    if (result.success) setRequestModelName('')
    setIsRequestingModel(false)
    setTimeout(() => setRequestModelMessage(null), 5000)
  }

  const handleSaveSettings = () => {
    setChatSettings({
      ...chatSettings,
      model: defaultModel,
      temperature: defaultTemperature,
    })
    setConnectionMessage('Settings saved successfully!')
    setTimeout(() => setConnectionMessage(''), 5000)
  }

  const handleConnect = async () => {
    const result = await connectToTensorlink()
    setConnectionMessage(result.message)
    setTimeout(() => setConnectionMessage(''), 7000)
  }

  const handleViewStats = async () => {
    await getTensorlinkStats()
    setShowStats(true)
  }

  const formatBytes = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    if (bytes === 0) return '0 Bytes'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i]
  }

  const handleSaveApiUrl = () => {
    // Save to localStorage or state management
    localStorage.setItem('tensorlink_api_url', apiUrl)
  }

  return (
    <div className="p-2 sm:p-6 text-white max-w-4xl mx-auto">
      <div className="flex flex-row justify-between">
        <h2 className="text-2xl font-bold mb-4">Settings</h2>
        <button 
          onClick={handleChatSelect}
          className="bg-zinc-950 my-3 gap-0.5 p-0.5 px-1.5 flex items-center"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 14l-4-4m0 0l4-4m-4 4h11a4 4 0 014 4v1"
            />
          </svg>
          Back
        </button>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">Model Preferences</h3>
          <div className="bg-zinc-800 rounded-lg p-4 space-y-4">
            <div>
              <div className="flex flex-row justify-between">
                <label className="block text-sm text-white/70 mb-1">Default Model</label>   
                <button
                  onClick={refreshModels}
                  className="mb-1 bg-zinc-700 hover:bg-zinc-600 text-white text-xs px-3 py-1 rounded-md transition-colors"
                >
                  Refresh Active Models
                </button>
              </div>

              <select
                value={defaultModel}
                onChange={(e) => setDefaultModel(e.target.value)}
                className="w-full bg-zinc-700 rounded-md p-2 text-sm"
                disabled={availableModels.length === 0}
              >
                {availableModels.length > 0 ? (
                  availableModels.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name}
                      {model.requires_tensorlink ? ' (Tensorlink)' : ''}
                    </option>
                  ))
                ) : (
                  <option value="">Loading models...</option>
                )}
              </select>
              {availableModels.length > 0 && (
                <p className="text-xs text-white/50 mt-1">
                  {availableModels.length} model{availableModels.length !== 1 ? 's' : ''} available
                </p>
              )}
            </div>

            {/* Request Model Section */}
            <div
              ref={requestModelRef}
              className="mt-4 border border-white/10 rounded-md p-3 bg-zinc-900/40"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="text-sm text-white/60">
                    Don't see your model?
                  </p>
                  <p className="text-xs text-white/40">
                    Submit a Hugging Face model ID and it will be added to the network if resources are available.
                  </p>
                </div>
              </div>

              <div className="mt-3 flex flex-col gap-3">

                {/* Input + Square Button */}
                <div className="flex">
                  <input
                    type="text"
                    value={requestModelName}
                    onChange={(e) => setRequestModelName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleRequestModel()}
                    className="flex-1 bg-zinc-800 border border-white/10 border-r-0 px-3 h-9 text-xs font-mono placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-blue-500/30"
                    placeholder="mistralai/Mistral-7B-Instruct-v0.2"
                  />

                  <button
                    onClick={handleRequestModel}
                    disabled={isRequestingModel || !requestModelName.trim()}
                    className="h-9 w-9 !rounded flex items-center justify-center bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-600 disabled:cursor-not-allowed text-white transition-colors"
                  >
                    {isRequestingModel ? (
                      <span className="animate-pulse text-xs">…</span>
                    ) : (
                      <span className="text-sm">→</span>
                    )}
                  </button>
                </div>

                {/* Slider Section (unchanged) */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-white/50">
                    Load time ({requestMinutes} min)
                  </label>

                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={1}
                      max={300}
                      value={requestMinutes}
                      onChange={(e) => setRequestMinutes(Number(e.target.value))}
                      className="flex-1 h-1 accent-blue-500"
                    />

                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={requestMinutes}
                      onChange={(e) =>
                        setRequestMinutes(
                          Math.max(1, Math.min(60, Number(e.target.value) || 1))
                        )
                      }
                      className="w-14 bg-zinc-800 border border-white/10 rounded-md px-2 py-1 text-xs text-center"
                    />
                  </div>
                </div>
              </div>

              {requestModelMessage && (
                <div
                  className={`mt-2 text-xs px-3 py-2 rounded ${
                    requestModelMessage.success
                      ? 'text-green-400 bg-blue-900/20'
                      : 'text-red-400 bg-red-900/20'
                  }`}
                >
                  {requestModelMessage.text}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm text-white/70 mb-1">
                Default Temperature: {defaultTemperature.toFixed(1)}
              </label>
              <input
                type="range"
                className="w-full"
                min="0"
                max="2"
                step="0.1"
                value={defaultTemperature}
                onChange={(e) => setDefaultTemperature(parseFloat(e.target.value))}
              />
              <div className="flex justify-between text-xs text-white/50">
                <span>More Precise</span>
                <span>More Creative</span>
              </div>
            </div>

            <div>
              <label className="block text-sm text-white/70 mb-1">
                Max Tokens: {chatSettings.maxTokens}
              </label>
              <input
                type="range"
                min="256"
                max="4096"
                step="256"
                value={chatSettings.maxTokens}
                onChange={(e) =>
                  setChatSettings({ ...chatSettings, maxTokens: parseInt(e.target.value) })
                }
                className="w-full"
              />
            </div>

            <button
              onClick={handleSaveSettings}
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md text-sm w-full transition-colors"
            >
              Save Model Preferences
            </button>

            {connectionMessage && (
              <div className="text-sm text-center text-blue-400 bg-blue-900/20 py-2 px-3 rounded">
                {connectionMessage}
              </div>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">Node Status</h3>
          <div className="bg-zinc-800 rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Connection Status</div>
                <div className="text-sm text-white/70">
                  {chatSettings.isTensorlinkConnected ? (
                    <span className="text-green-400">✓ Connected</span>
                  ) : (
                    <span className="text-yellow-400">○ Not Connected</span>
                  )}
                </div>
              </div>
              <button
                onClick={handleConnect}
                disabled={isConnectingTensorlink || chatSettings.isTensorlinkConnected}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-600 disabled:cursor-not-allowed text-white py-1 px-2 rounded-md text-sm transition-colors"
              >
                {isConnectingTensorlink
                  ? 'Connecting...'
                  : chatSettings.isTensorlinkConnected
                    ? 'Connected'
                    : 'Connect'}
              </button>
            </div>

            {chatSettings.isTensorlinkConnected && (
              <div>
                <button
                  onClick={handleViewStats}
                  className="bg-zinc-700 hover:bg-zinc-600 text-white py-2 px-4 rounded-md text-sm w-full transition-colors"
                >
                  View Network Statistics
                </button>
              </div>
            )}

            <div className="text-xs text-white/50 border-t border-white/10 pt-3 mt-3">
              <p>
                Tensorlink provides access to distributed AI models across a peer-to-peer network.
                Connect to access additional models and network features.
              </p>
            </div>
          </div>
        </div>

        {/* API Configuration */}
        <div>
          <h3 className="text-lg font-semibold mb-2">API Configuration</h3>
          <div className="bg-zinc-800 rounded-lg p-4 space-y-4">
            <div>
              <label className="block text-sm text-white/70 mb-2">API URL</label>
              <input
                type="text"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                className="w-full bg-zinc-700 rounded-md p-2 text-sm font-mono"
                placeholder="https://example.com/api"
              />
              <p className="text-xs text-white/50 mt-1">
                Enter the Tensorlink API endpoint URL
              </p>
            </div>

            <button
              onClick={handleSaveApiUrl}
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md text-sm w-full transition-colors"
            >
              Save API URL
            </button>

            {connectionMessage && (
              <div className="text-sm text-center text-blue-400 bg-blue-900/20 py-2 px-3 rounded">
                {connectionMessage}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Modal */}
      {showStats && tensorlinkStats && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-zinc-800 rounded-lg p-6 max-w-md w-full mx-4 border border-white/20">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">Tensorlink Network Stats</h3>
              <button
                onClick={() => setShowStats(false)}
                className="text-white/60 hover:text-white"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-white/70">Validators:</span>
                <span className="text-white font-mono">{tensorlinkStats.validators}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Workers:</span>
                <span className="text-white font-mono">{tensorlinkStats.workers}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Users:</span>
                <span className="text-white font-mono">{tensorlinkStats.users}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Proposals:</span>
                <span className="text-white font-mono">{tensorlinkStats.proposal}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Available Capacity:</span>
                <span className="text-white font-mono">
                  {formatBytes(tensorlinkStats.available_capacity)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Used Capacity:</span>
                <span className="text-white font-mono">
                  {formatBytes(tensorlinkStats.used_capacity)}
                </span>
              </div>
              <div className="mt-4">
                <span className="text-white/70">Available Models:</span>
                <div className="mt-2 space-y-1">
                  {tensorlinkStats.models.map((model, index) => (
                    <div
                      key={index}
                      className="bg-zinc-700 px-2 py-1 rounded text-xs font-mono text-white"
                    >
                      {model}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowStats(false)}
              className="mt-4 w-full bg-zinc-700 hover:bg-zinc-600 text-white py-2 rounded-md text-sm"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
