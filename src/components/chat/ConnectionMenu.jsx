import { useEffect, useRef, useState } from 'react'
import { MdKeyboardArrowDown, MdCheck, MdPsychology, MdLanguage, MdRefresh } from 'react-icons/md'
import { useStore } from './store.jsx'
import { StatusDot } from './ui.jsx'

const STATUS_TEXT = { connected: 'Online', checking: 'Checking…', disconnected: 'Offline' }
const formatCtx = (n) => (n ? `${Math.round(n / 1024)}K` : '')

function SectionLabel({ children, action }) {
  return (
    <div className="mb-1.5 flex items-center justify-between">
      <p className="text-[10px] uppercase tracking-[0.15em] text-[#5B6272]">{children}</p>
      {action}
    </div>
  )
}

function StatusRow({ label, status, detail }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <div className="flex min-w-0 items-center gap-2">
        <StatusDot status={status} />
        <span className="truncate text-sm text-[#EDEFF4]">{label}</span>
      </div>
      <span className="shrink-0 text-xs text-[#8B93A7]">{detail}</span>
    </div>
  )
}

function SliderRow({ label, display, left, right, ...input }) {
  return (
    <div className="mb-3 last:mb-0">
      <div className="flex items-baseline justify-between">
        <span className="text-xs text-[#8B93A7]">{label}</span>
        <span className="text-xs tabular-nums text-[#EDEFF4]">{display}</span>
      </div>
      <input type="range" aria-label={label} className="w-full accent-[#4FD8C4]" {...input} />
      {left && (
        <div className="flex justify-between text-[10px] text-[#5B6272]">
          <span>{left}</span>
          <span>{right}</span>
        </div>
      )}
    </div>
  )
}

export default function ConnectionMenu({ onOpenDashboard }) {
  const { nodeUrl, models, settings, setSettings, selectModel, connection, recheck } = useStore()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const poll = recheck

  useEffect(() => {
    if (!open) return
    const onDown = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false)
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const current = models.find((m) => m.id === settings.model)
  const routeStatus = connection.status
  const d = current?.defaults || {}
  const tokenCap = current?.contextLength ? Math.min(current.contextLength, 16384) : 4096
  const differsFromDefaults =
    (d.temperature != null && d.temperature !== settings.temperature) ||
    (d.topP != null && d.topP !== settings.topP)

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
        title="Connection & model settings"
        className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 sm:px-3 sm:py-1.5 text-xs font-medium text-[#9AA2B4] transition-colors hover:border-white/20"
      >
        <StatusDot status={routeStatus} />
        <span className="max-w-[120px] truncate sm:max-w-[220px]">{current?.name || 'Select model'}</span>
        <MdKeyboardArrowDown className={`shrink-0 text-[#5B6272] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          role="dialog"
          className="absolute right-0 top-full z-20 mt-2 max-h-[calc(100dvh-4.5rem)] w-[min(20rem,calc(100vw-1.5rem))] overflow-y-auto rounded-xl border border-white/10 bg-[#12151c] p-3 shadow-xl shadow-black/40"
        >
          {/* Connection */}
          <SectionLabel
            action={
              <button onClick={poll} title="Re-check connection" className="rounded p-0.5 text-[#8B93A7] hover:bg-white/10 hover:text-[#EDEFF4]">
                <MdRefresh size={14} />
              </button>
            }
          >
            Connection
          </SectionLabel>
          <StatusRow
            label={nodeUrl ? 'Personal node' : 'Public network'}
            status={routeStatus}
            detail={routeStatus === 'connected' && connection.latencyMs != null ? `${connection.latencyMs} ms` : STATUS_TEXT[routeStatus]}
          />
          <button
            onClick={() => {
              setOpen(false)
              onOpenDashboard?.('connection')
            }}
            className="mt-1 text-xs text-[#4FD8C4] transition-colors hover:text-[#6EE2D1]"
          >
            {nodeUrl ? 'Manage connection →' : 'Use your own node →'}
          </button>
          {nodeUrl && routeStatus === 'disconnected' && (
            <p className="mt-1 text-[11px] text-amber-300/80">Your node is unreachable. Requests won't fall back to the public API.</p>
          )}

          {/* Model */}
          <div className="my-3 h-px bg-white/10" />
          <SectionLabel>Model</SectionLabel>
          <div className="max-h-44 space-y-0.5 overflow-y-auto">
            {models.length === 0 && <p className="px-2.5 py-2 text-xs text-[#5B6272]">Loading models…</p>}
            {models.map((m) => {
              const selected = m.id === settings.model
              return (
                <button
                  key={m.id}
                  onClick={() => selectModel(m.id)}
                  className={`flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm transition-colors ${
                    selected ? 'bg-white/10 text-[#EDEFF4]' : 'text-[#9AA2B4] hover:bg-white/[0.06]'
                  }`}
                >
                  <span className="flex-1 truncate">{m.name}</span>
                  {m.contextLength && <span className="shrink-0 text-[10px] text-[#5B6272]">{formatCtx(m.contextLength)} ctx</span>}
                  {m.requires_tensorlink && <span className="shrink-0 text-[10px] text-[#5B6272]">Tensorlink</span>}
                  {m.supports_reasoning === true && <MdPsychology size={13} title="Supports reasoning" className="shrink-0 text-[#5B6272]" />}
                  {m.supports_web_search === true && <MdLanguage size={13} title="Supports web search" className="shrink-0 text-[#5B6272]" />}
                  {selected && <MdCheck size={14} className="shrink-0 text-[#4FD8C4]" />}
                </button>
              )
            })}
          </div>
          {current && (
            <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-0.5 rounded-lg bg-white/[0.03] px-2.5 py-2 text-[11px]">
              {current.type && (
                <>
                  <dt className="text-[#5B6272]">Type</dt>
                  <dd className="text-right text-[#EDEFF4]">{current.type}</dd>
                </>
              )}
              {current.contextLength && (
                <>
                  <dt className="text-[#5B6272]">Context</dt>
                  <dd className="text-right text-[#EDEFF4]">{current.contextLength.toLocaleString()} tokens</dd>
                </>
              )}
              {d.temperature != null && (
                <>
                  <dt className="text-[#5B6272]">Default temp</dt>
                  <dd className="text-right text-[#EDEFF4]">{d.temperature}</dd>
                </>
              )}
              {d.topP != null && (
                <>
                  <dt className="text-[#5B6272]">Default top-p</dt>
                  <dd className="text-right text-[#EDEFF4]">{d.topP}</dd>
                </>
              )}
            </dl>
          )}
          <button
            onClick={() => {
              setOpen(false)
              onOpenDashboard?.('models')
            }}
            className="mt-2 px-2.5 text-xs text-[#4FD8C4] transition-colors hover:text-[#6EE2D1]"
          >
            Don't see your model? Request one →
          </button>

          {/* Generation settings */}
          <div className="my-3 h-px bg-white/10" />
          <SectionLabel
            action={
              differsFromDefaults && (
                <button onClick={() => selectModel(current.id)} className="text-[10px] text-[#4FD8C4] hover:text-[#6EE2D1]">
                  Reset to model defaults
                </button>
              )
            }
          >
            Generation
          </SectionLabel>
          <SliderRow
            label="Temperature"
            display={settings.temperature.toFixed(1)}
            left="Precise"
            right="Creative"
            min="0"
            max="2"
            step="0.1"
            value={settings.temperature}
            onChange={(e) => setSettings({ temperature: parseFloat(e.target.value) })}
          />
          <SliderRow
            label="Top-p"
            display={settings.topP.toFixed(2)}
            min="0"
            max="1"
            step="0.05"
            value={settings.topP}
            onChange={(e) => setSettings({ topP: parseFloat(e.target.value) })}
          />
          <SliderRow
            label="Max tokens"
            display={Math.min(settings.maxTokens, tokenCap)}
            min="256"
            max={tokenCap}
            step="256"
            value={Math.min(settings.maxTokens, tokenCap)}
            onChange={(e) => setSettings({ maxTokens: parseInt(e.target.value, 10) })}
          />
          <p className="mt-2 text-[11px] text-[#5B6272]">Applies to all chats. Reasoning, web search and chat history are toggled above the message box.</p>
        </div>
      )}
    </div>
  )
}
