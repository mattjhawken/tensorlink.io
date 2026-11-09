import { useState } from 'react'
import { MdCheckCircle } from 'react-icons/md'
import { useStore } from '../store.jsx'
import { requestModel as requestModelApi } from '../api.js'
import { PrimaryButton, inputBase, Section } from '../ui.jsx'
import ModelBrowser from '../ModelBrowser.jsx'

export default function Models() {
  const { settings, setSettings, selectModel, models, target } = useStore()

  const [requestName, setRequestName] = useState('')
  const [requestMinutes, setRequestMinutes] = useState(30)
  const [requesting, setRequesting] = useState(false)
  const [requestMessage, setRequestMessage] = useState(null)

  const current = models.find((m) => m.id === settings.model)
  const d = current?.defaults || {}
  const tokenCap = current?.contextLength ? Math.min(current.contextLength, 16384) : 4096
  const differsFromDefaults =
    (d.temperature != null && d.temperature !== settings.temperature) ||
    (d.topP != null && d.topP !== settings.topP)

  const handleRequestModel = async () => {
    if (!requestName.trim()) return
    setRequesting(true)
    setRequestMessage(null)
    const result = await requestModelApi(target.base, requestName.trim(), requestMinutes)
    setRequestMessage(result)
    if (result.success) setRequestName('')
    setRequesting(false)
    setTimeout(() => setRequestMessage(null), 6000)
  }

  return (
    <>
      <Section label="Models" accent="#A78BFA">
        <h2 className="font-bold text-lg text-[#EDEFF4] mb-4">Model Preferences</h2>

        <label className="block text-xs text-[#8B93A7] mb-1.5">Default model</label>
        <select
          value={settings.model}
          onChange={(e) => selectModel(e.target.value)}
          className={`${inputBase} mb-2`}
        >
          {models.length ? (
            models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
                {m.contextLength ? ` · ${Math.round(m.contextLength / 1024)}K ctx` : ''}
                {m.requires_tensorlink ? ' (Tensorlink)' : ''}
              </option>
            ))
          ) : (
            <option>Loading models…</option>
          )}
        </select>

        {current && (
          <dl className="mb-4 grid grid-cols-2 gap-x-3 gap-y-0.5 rounded-lg bg-white/[0.03] px-3 py-2 text-xs">
            {current.type && (
              <>
                <dt className="text-[#5B6272]">Type</dt>
                <dd className="text-right text-[#EDEFF4]">{current.type}</dd>
              </>
            )}
            {current.contextLength && (
              <>
                <dt className="text-[#5B6272]">Context window</dt>
                <dd className="text-right text-[#EDEFF4]">{current.contextLength.toLocaleString()} tokens</dd>
              </>
            )}
            {current.supports_reasoning != null && (
              <>
                <dt className="text-[#5B6272]">Reasoning</dt>
                <dd className="text-right text-[#EDEFF4]">{current.supports_reasoning ? 'Supported' : 'No'}</dd>
              </>
            )}
            {d.temperature != null && (
              <>
                <dt className="text-[#5B6272]">Recommended temp</dt>
                <dd className="text-right text-[#EDEFF4]">{d.temperature}</dd>
              </>
            )}
            {d.topP != null && (
              <>
                <dt className="text-[#5B6272]">Recommended top-p</dt>
                <dd className="text-right text-[#EDEFF4]">{d.topP}</dd>
              </>
            )}
          </dl>
        )}

        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-xs text-[#8B93A7]">Temperature: {settings.temperature.toFixed(1)}</span>
          {differsFromDefaults && (
            <button onClick={() => selectModel(current.id)} className="text-[11px] text-[#4FD8C4] hover:text-[#6EE2D1]">
              Reset to model defaults
            </button>
          )}
        </div>
        <input
          type="range"
          min="0"
          max="2"
          step="0.1"
          value={settings.temperature}
          onChange={(e) => setSettings({ temperature: parseFloat(e.target.value) })}
          className="w-full accent-[#4FD8C4] mb-1"
        />
        <div className="flex justify-between text-[11px] text-[#5B6272] mb-4">
          <span>More precise</span>
          <span>More creative</span>
        </div>

        <label className="block text-xs text-[#8B93A7] mb-1.5">Top-p: {settings.topP.toFixed(2)}</label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={settings.topP}
          onChange={(e) => setSettings({ topP: parseFloat(e.target.value) })}
          className="w-full accent-[#4FD8C4] mb-4"
        />

        <label className="block text-xs text-[#8B93A7] mb-1.5">Max tokens: {Math.min(settings.maxTokens, tokenCap)}</label>
        <input
          type="range"
          min="256"
          max={tokenCap}
          step="256"
          value={Math.min(settings.maxTokens, tokenCap)}
          onChange={(e) => setSettings({ maxTokens: parseInt(e.target.value, 10) })}
          className="w-full accent-[#4FD8C4]"
        />
      </Section>

      <Section label="Request" accent="#F59E0B">
        <h2 className="font-bold text-lg text-[#EDEFF4] mb-1">Request a Model</h2>
        <p className="text-sm text-[#8B93A7] mb-4">
          Browse what's popular on the network or on Hugging Face, or type any model ID directly — it'll be added
          if resources are available.
        </p>

        <ModelBrowser apiUrl={target.base} onPick={setRequestName} selectedId={requestName} />

        <div className="flex items-center gap-2 my-3">
          <span className="h-px flex-1 bg-white/10" />
          <span className="text-[10px] tracking-[0.15em] uppercase text-[#5B6272]">or enter manually</span>
          <span className="h-px flex-1 bg-white/10" />
        </div>

        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={requestName}
            onChange={(e) => setRequestName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleRequestModel()}
            placeholder="mistralai/Mistral-7B-Instruct-v0.2"
            className={`${inputBase} flex-1 font-mono text-xs`}
          />
          <PrimaryButton onClick={handleRequestModel} disabled={requesting || !requestName.trim()} className="!rounded-lg shrink-0">
            {requesting ? '…' : 'Request'}
          </PrimaryButton>
        </div>
        <label className="block text-xs text-[#8B93A7] mb-1.5 mt-3">Reserve for: {requestMinutes} min</label>
        <input
          type="range"
          min="5"
          max="120"
          step="5"
          value={requestMinutes}
          onChange={(e) => setRequestMinutes(parseInt(e.target.value))}
          className="w-full accent-[#4FD8C4]"
        />
        {requestMessage && (
          <div className={`mt-3 flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${requestMessage.success ? 'bg-emerald-400/10 text-emerald-300 border border-emerald-400/20' : 'bg-red-400/10 text-red-300 border border-red-400/20'}`}>
            {requestMessage.success && <MdCheckCircle size={15} />}
            <span>{requestMessage.message}</span>
          </div>
        )}
      </Section>
    </>
  )
}
