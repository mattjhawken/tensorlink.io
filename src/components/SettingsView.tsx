import { useChatSettings } from '../hooks/useChatSettings'
import { useState, useEffect } from 'react'

// Settings view component
export const SettingsView = () => {
  const {
    availableModels,
    chatSettings,
    setChatSettings,
    isConnectingTensorlink,
    tensorlinkStats,
    connectToTensorlink,
    getTensorlinkStats,
  } = useChatSettings()

  const [defaultModel, setDefaultModel] = useState(chatSettings.model)
  const [defaultTemperature, setDefaultTemperature] = useState(chatSettings.temperature)
  const [connectionMessage, setConnectionMessage] = useState('')
  const [showStats, setShowStats] = useState(false)

  // Update local state when chatSettings changes
  useEffect(() => {
    setDefaultModel(chatSettings.model)
    setDefaultTemperature(chatSettings.temperature)
  }, [chatSettings])

  const handleSaveSettings = () => {
    setChatSettings({
      ...chatSettings,
      model: defaultModel,
      temperature: defaultTemperature,
    })
    setConnectionMessage('Settings saved successfully!')
    setTimeout(() => setConnectionMessage(''), 3000)
  }

  const handleConnect = async () => {
    const result = await connectToTensorlink()
    setConnectionMessage(result.message)
    setTimeout(() => setConnectionMessage(''), 5000)
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

  return (
    <div className="p-6 text-white max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Settings</h2>

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">Model Preferences</h3>
          <div className="bg-zinc-800 rounded-lg p-4 space-y-4">
            <div>
              <label className="block text-sm text-white/70 mb-1">Default Model</label>
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
              <div className="text-sm text-center text-green-400 bg-green-900/20 py-2 px-3 rounded">
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
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-600 disabled:cursor-not-allowed text-white py-2 px-4 rounded-md text-sm transition-colors"
              >
                {isConnectingTensorlink
                  ? 'Connecting...'
                  : chatSettings.isTensorlinkConnected
                    ? 'Connected'
                    : 'Connect to Tensorlink'}
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

        {/* Available Models List */}
        {availableModels.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-2">Available Models</h3>
            <div className="bg-zinc-800 rounded-lg p-4">
              <div className="space-y-2">
                {availableModels.map((model) => (
                  <div
                    key={model.id}
                    className="bg-zinc-700 rounded-md p-3 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-medium text-sm">{model.name}</div>
                      <div className="text-xs text-white/50">{model.id}</div>
                    </div>
                    {model.requires_tensorlink && (
                      <span className="text-xs bg-blue-600/20 text-blue-400 px-2 py-1 rounded">
                        Tensorlink
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
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