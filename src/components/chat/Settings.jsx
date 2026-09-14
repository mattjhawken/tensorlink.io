import { useEffect, useState } from 'react'
import { MdArrowBack, MdCheckCircle } from 'react-icons/md'
import { useStore } from './store.jsx'
import { checkAlive, fetchModels, requestModel as requestModelApi } from './api.js'
import { card, tile, Eyebrow, PrimaryButton, inputBase, StatusDot } from './ui.jsx'
import ModelBrowser from './ModelBrowser.jsx'

function Section({ label, accent, children }) {
  return (
    <div className={`${card} p-4 sm:p-6 mb-4`}>
      <Eyebrow label={label} accent={accent} />
      {children}
    </div>
  )
}

export default function Settings({ onBack }) {
  const { settings, setSettings, nodeUrl, connectNode, disconnectNode, apiUrl, setApiUrl } = useStore()

  const [models, setModels] = useState([])
  const [customNodeUrl, setCustomNodeUrl] = useState(nodeUrl)
  const [nodeStatus, setNodeStatus] = useState(nodeUrl ? 'checking' : 'disconnected')
  const [apiUrlDraft, setApiUrlDraft] = useState(apiUrl)
  const [message, setMessage] = useState('')

  const [requestName, setRequestName] = useState('')
  const [requestMinutes, setRequestMinutes] = useState(30)
  const [requesting, setRequesting] = useState(false)
  const [requestMessage, setRequestMessage] = useState(null)

  useEffect(() => {
    fetchModels({ apiUrl, nodeUrl, nodeConnected: !!nodeUrl }).then(setModels)
  }, [apiUrl, nodeUrl])

  useEffect(() => {
    if (!nodeUrl) {
      setNodeStatus('disconnected')
      return
    }
    let cancelled = false
    setNodeStatus('checking')
    checkAlive(nodeUrl).then((ok) => !cancelled && setNodeStatus(ok ? 'connected' : 'disconnected'))
    return () => {
      cancelled = true
    }
  }, [nodeUrl])

  const flash = (text) => {
    setMessage(text)
    setTimeout(() => setMessage(''), 4000)
  }

  const handleConnectNode = () => {
    const url = customNodeUrl.trim()
    if (!url) return
    connectNode(url)
    flash('Node URL saved — checking connection…')
  }

  const handleDisconnectNode = () => {
    disconnectNode()
    setCustomNodeUrl('')
    flash('Disconnected from personal node.')
  }

  const handleSaveApiUrl = () => {
    setApiUrl(apiUrlDraft.trim())
    flash('API URL saved.')
  }

  const handleRequestModel = async () => {
    if (!requestName.trim()) return
    setRequesting(true)
    setRequestMessage(null)
    const result = await requestModelApi(apiUrl, requestName.trim(), requestMinutes)
    setRequestMessage(result)
    if (result.success) setRequestName('')
    setRequesting(false)
    setTimeout(() => setRequestMessage(null), 6000)
  }

  return (
    <div className="px-3 sm:px-6 py-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Eyebrow label="Preferences" />
          <h1 className="text-2xl font-bold text-[#EDEFF4]">Settings</h1>
        </div>
        <button onClick={onBack} className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-sm text-[#9AA2B4] hover:border-white/20 transition-colors">
          <MdArrowBack size={15} /> Back
        </button>
      </div>

      {/* Personal node */}
      <Section label="Privacy" accent="#4FD8C4">
        <h2 className="font-bold text-lg text-[#EDEFF4] mb-1">Personal Node</h2>
        <p className="text-sm text-[#8B93A7] mb-4">
          Connect your own Tensorlink node to keep chat requests off the public network entirely — combined with the
          fact that everything else is stored only in this browser's local storage, this is the most private way to
          use the app.
        </p>

        <div className={`${tile} flex items-center justify-between px-4 py-3 mb-3`}>
          <div className="flex items-center gap-2">
            <StatusDot status={nodeUrl ? nodeStatus : 'disconnected'} />
            <span className="text-sm text-[#EDEFF4]">{nodeUrl ? (nodeStatus === 'connected' ? 'Connected to your node' : nodeStatus === 'checking' ? 'Checking…' : 'Node unreachable') : 'No personal node connected'}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={customNodeUrl}
            onChange={(e) => setCustomNodeUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleConnectNode()}
            placeholder="wss://your-node-url.com"
            className={`${inputBase} flex-1 font-mono text-xs`}
          />
          {nodeUrl ? (
            <button onClick={handleDisconnectNode} className="rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-2 text-sm font-medium text-red-300 hover:bg-red-400/20 transition-colors">
              Disconnect
            </button>
          ) : (
            <PrimaryButton onClick={handleConnectNode} disabled={!customNodeUrl.trim()} className="!rounded-lg">
              Connect
            </PrimaryButton>
          )}
        </div>
      </Section>

      {/* Model preferences */}
      <Section label="Models" accent="#A78BFA">
        <h2 className="font-bold text-lg text-[#EDEFF4] mb-4">Model Preferences</h2>

        <label className="block text-xs text-[#8B93A7] mb-1.5">Default model</label>
        <select
          value={settings.model}
          onChange={(e) => setSettings({ model: e.target.value })}
          className={`${inputBase} mb-4`}
        >
          {models.length ? (
            models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
                {m.requires_tensorlink ? ' (Tensorlink)' : ''}
              </option>
            ))
          ) : (
            <option>Loading models…</option>
          )}
        </select>

        <label className="block text-xs text-[#8B93A7] mb-1.5">Temperature: {settings.temperature.toFixed(1)}</label>
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

        <label className="block text-xs text-[#8B93A7] mb-1.5">Max tokens: {settings.maxTokens}</label>
        <input
          type="range"
          min="256"
          max="4096"
          step="256"
          value={settings.maxTokens}
          onChange={(e) => setSettings({ maxTokens: parseInt(e.target.value) })}
          className="w-full accent-[#4FD8C4]"
        />
      </Section>

      {/* Request a model */}
      <Section label="Request" accent="#F59E0B">
        <h2 className="font-bold text-lg text-[#EDEFF4] mb-1">Request a Model</h2>
        <p className="text-sm text-[#8B93A7] mb-4">
          Browse what's popular on the network or on Hugging Face, or type any model ID directly — it'll be added
          if resources are available.
        </p>

        <ModelBrowser apiUrl={apiUrl} onPick={setRequestName} selectedId={requestName} />

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

      {/* API config */}
      <Section label="Advanced" accent="#60A5FA">
        <h2 className="font-bold text-lg text-[#EDEFF4] mb-1">API Configuration</h2>
        <p className="text-sm text-[#8B93A7] mb-4">The public Tensorlink API endpoint used when no personal node is connected.</p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={apiUrlDraft}
            onChange={(e) => setApiUrlDraft(e.target.value)}
            className={`${inputBase} flex-1 font-mono text-xs`}
          />
          <PrimaryButton onClick={handleSaveApiUrl} className="!rounded-lg">
            Save
          </PrimaryButton>
        </div>
      </Section>

      {message && (
        <div className="rounded-lg border border-[#4FD8C4]/30 bg-[#4FD8C4]/10 px-3 py-2.5 text-sm text-emerald-300 text-center">
          {message}
        </div>
      )}
    </div>
  )
}
