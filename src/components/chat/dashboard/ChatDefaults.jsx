import { useStore } from '../store.jsx'
import { tile, Section, Toggle } from '../ui.jsx'
import { useRagStatus } from '../rag/useRag.js'
import { resolveProvider, wipeIndex, rebuildIndex } from '../rag/index.js'

const PROVIDER_LABEL = {
  node: 'your personal node',
  public: 'the public Tensorlink API',
  local: 'this browser (MiniLM, in-browser)',
}

function FallbackOption({ value, current, title, description, warning, ackLabel, acked, onSelect, onAck }) {
  const selected = current === value
  return (
    <div className={`rounded-lg border px-3 py-2.5 ${selected ? 'border-[#4FD8C4]/40 bg-[#4FD8C4]/[0.04]' : 'border-white/10'}`}>
      <label className="flex cursor-pointer items-start gap-2.5">
        <input type="radio" name="rag-fallback" checked={selected} onChange={() => onSelect(value)} className="mt-1 accent-[#4FD8C4]" />
        <div>
          <p className="text-sm text-[#EDEFF4]">{title}</p>
          <p className="text-xs text-[#8B93A7]">{description}</p>
        </div>
      </label>
      {selected && warning && (
        <div className="mt-2 ml-6 rounded-md border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs text-amber-200">
          <p>{warning}</p>
          <label className="mt-2 flex cursor-pointer items-center gap-2 text-amber-100">
            <input type="checkbox" checked={acked} onChange={(e) => onAck(e.target.checked)} className="accent-[#F59E0B]" />
            {ackLabel}
          </label>
        </div>
      )}
    </div>
  )
}

function RagSection() {
  const { settings, setSettings, nodeUrl, apiUrl, chats } = useStore()
  const status = useRagStatus()
  const emb = { fallback: 'none', publicConsent: false, localAck: false, ...settings.ragEmbedding }
  const provider = resolveProvider({ nodeUrl, settings })
  const ctx = { chats, settings, nodeUrl, apiUrl }

  const toggleEnabled = (on) => {
    if (on) {
      setSettings({ ragEnabled: true })
      return
    }
    if (window.confirm('Also delete the search index stored in this browser?')) wipeIndex()
    setSettings({ ragEnabled: false, features: { ...settings.features, rag: false } })
  }
  // Switching source resets the acknowledgements — consent is per choice, not sticky.
  const pickFallback = (fallback) => setSettings({ ragEmbedding: { fallback, publicConsent: false, localAck: false } })
  const ack = (patch) => setSettings({ ragEmbedding: { ...emb, ...patch } })

  const pct = status.total ? Math.round((status.done / status.total) * 100) : 0

  return (
    <Section label="History" accent="#F472B6">
      <h2 className="font-bold text-lg text-[#EDEFF4] mb-1">Chat History Search</h2>
      <p className="text-sm text-[#8B93A7] mb-2">
        Lets the assistant pull relevant excerpts from your earlier chats into a new one. Excerpts are turned into
        vectors and stored only in this browser, and the search itself runs here too. Off by default.
      </p>
      <Toggle label="Allow chat history search" checked={!!settings.ragEnabled} onChange={toggleEnabled} />

      {settings.ragEnabled && (
        <>
          <p className="mt-2 mb-2 text-xs text-[#8B93A7]">Embedding source</p>
          <div className={`${tile} mb-2 px-3 py-2.5`}>
            <p className="text-sm text-[#EDEFF4]">Personal node {nodeUrl ? <span className="text-emerald-400">· connected</span> : <span className="text-[#5B6272]">· not connected</span>}</p>
            <p className="text-xs text-[#8B93A7]">
              Used automatically whenever a node is set, so your history is embedded on your own hardware. If the node
              is unreachable, indexing waits — it never falls back to another source on its own.
            </p>
          </div>

          <p className="mb-1.5 text-xs text-[#8B93A7]">When no personal node is connected</p>
          <div className="space-y-2">
            <FallbackOption
              value="none"
              current={emb.fallback}
              title="Pause indexing"
              description="Nothing is embedded until you connect a personal node."
              onSelect={pickFallback}
            />
            <FallbackOption
              value="local"
              current={emb.fallback}
              title="Run a model in this browser"
              description="Private: your text never leaves this device."
              warning="Downloads a ~25 MB model from Hugging Face the first time, then runs on your device. Indexing can be slow and drain battery, especially on phones and laptops running on battery."
              ackLabel="I understand — use the in-browser model"
              acked={emb.localAck}
              onSelect={pickFallback}
              onAck={(v) => ack({ localAck: v })}
            />
            <FallbackOption
              value="public"
              current={emb.fallback}
              title="Use the public Tensorlink API"
              description="Fast, but your chat text is sent off this device to be embedded."
              warning="The text of your chats will be sent, in batches, to the public Tensorlink API to be embedded. Anyone operating that endpoint could see it. Prefer a personal node or the in-browser model for sensitive chats."
              ackLabel="I understand and consent to sending my chat text"
              acked={emb.publicConsent}
              onSelect={pickFallback}
              onAck={(v) => ack({ publicConsent: v })}
            />
          </div>

          <div className={`${tile} mt-3 px-3 py-2.5`}>
            <p className="text-sm text-[#EDEFF4]">
              {provider ? `Using ${PROVIDER_LABEL[provider]}` : 'Paused — connect a personal node or choose a fallback above'}
            </p>
            {provider && status.chunks > 0 && (
              <p className="text-xs text-[#8B93A7]">
                {status.indexed} of {status.chunks} excerpts indexed{status.model ? ` · ${status.model}` : ''}
              </p>
            )}
            {provider && status.phase === 'indexing' && (
              <div className="mt-2">
                <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full bg-[#4FD8C4] transition-all" style={{ width: `${pct}%` }} />
                </div>
                <p className="mt-1 text-[11px] text-[#5B6272]">{status.message}</p>
              </div>
            )}
            {status.phase === 'error' && <p className="mt-1 text-xs text-red-300">{status.message}</p>}
            <div className="mt-2 flex gap-2">
              <button
                disabled={!provider}
                onClick={() => rebuildIndex(ctx)}
                className="rounded-md border border-white/10 px-2.5 py-1 text-xs text-[#9AA2B4] hover:border-white/20 disabled:opacity-40"
              >
                Rebuild index
              </button>
              <button
                onClick={() => window.confirm('Delete the search index from this browser? Your chats are not affected.') && wipeIndex()}
                className="rounded-md border border-red-400/20 px-2.5 py-1 text-xs text-red-300 hover:border-red-400/40"
              >
                Delete index
              </button>
            </div>
          </div>

          <Toggle
            label="Use chat history by default in new chats"
            description="You can still switch it per chat from the button above the message box."
            checked={!!settings.features?.rag}
            onChange={(v) => setSettings({ features: { ...settings.features, rag: v } })}
          />
        </>
      )}
    </Section>
  )
}

export default function ChatDefaults() {
  const { settings, setSettings } = useStore()

  return (
    <>
      <Section label="Features" accent="#34D399">
        <h2 className="font-bold text-lg text-[#EDEFF4] mb-1">Chat Features</h2>
        <p className="text-sm text-[#8B93A7] mb-2">
          Defaults for new chats. You can still switch each one on or off per chat from the buttons above the message box.
        </p>
        <div className="divide-y divide-white/5">
          <Toggle
            label="Reasoning by default"
            description="Models that support it will think before answering. Slower and uses more tokens."
            checked={!!settings.features?.reasoning}
            onChange={(v) => setSettings({ features: { ...settings.features, reasoning: v } })}
          />
          <Toggle
            label="Web search by default"
            description="Search queries are sent to a third-party search provider, so they leave the Tensorlink network."
            checked={!!settings.features?.webSearch}
            onChange={(v) => setSettings({ features: { ...settings.features, webSearch: v } })}
          />
        </div>
      </Section>

      <RagSection />
    </>
  )
}
