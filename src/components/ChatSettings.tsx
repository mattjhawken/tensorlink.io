import React from 'react'
import { useChatSettings } from '../hooks/useChatSettings'

interface ChatSettingsProps {
  showSettings: boolean
  setShowSettings: (show: boolean) => void
  onNavigateToSettings?: () => void
}

export const ChatSettingsComponent: React.FC<ChatSettingsProps> = ({
  showSettings,
  setShowSettings,
  onNavigateToSettings
}) => {
  const {
    availableModels,
    chatSettings,
    setChatSettings,
    refreshModels
  } = useChatSettings()

  const handleRequestModel = () => {
    setShowSettings(false)
    onNavigateToSettings?.()
  }

  return (
    <div className="flex space-x-2 items-center">
      <div className="relative">
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="bg-neutral-800 hover:bg-neutral-600 text-white px-2 py-1 rounded-md text-sm flex items-center space-x-1"
        >
          <span>
            {availableModels.find((m) => m.id === chatSettings.model)?.name || 'Select Model'}
          </span>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showSettings && (
          <div className="absolute z-10 mt-2 w-64 bg-zinc-800 rounded-md shadow-lg p-2 border border-white/20">
            <div className="mb-2">
              <label className="text-xs text-white/70 block mb-1">Models</label>
              <select
                value={chatSettings.model}
                onChange={(e) => setChatSettings({ ...chatSettings, model: e.target.value })}
                className="w-full bg-gray-700 text-white text-sm rounded-md px-2 py-1"
              >
                {availableModels.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Request Model button */}
            <div className="border-b border-white/10 pb-2 flex gap-1">
              <button
                onClick={refreshModels}
                className="bg-blue-600 hover:bg-blue-700 text-white px-1 py-0.25 rounded flex items-center justify-center gap-1 transition-colors"
              >
                <svg className="h-3 w-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="text-xs whitespace-nowrap">Refresh</span>
              </button>
              <button
                onClick={handleRequestModel}
                className="bg-blue-600 hover:bg-blue-700 text-white px-1 py-0.25 rounded flex items-center justify-center gap-1 transition-colors"
              >
                <svg className="h-3 w-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-xs whitespace-nowrap">Request a Model</span>
              </button>
            </div>

            <div className="my-2">
              <label className="text-xs text-white/70 block mb-1">
                Temperature: {chatSettings.temperature.toFixed(1)}
              </label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={chatSettings.temperature}
                onChange={(e) =>
                  setChatSettings({ ...chatSettings, temperature: parseFloat(e.target.value) })
                }
                className="w-full"
              />
              <div className="flex justify-between text-xs text-white/50">
                <span>More Precise</span>
                <span>More Creative</span>
              </div>
            </div>

            <div className="mb-2">
              <label className="text-xs text-white/70 block mb-1">
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
          </div>
        )}
      </div>
    </div>
  )
}