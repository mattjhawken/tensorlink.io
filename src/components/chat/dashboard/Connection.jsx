import { useEffect, useMemo, useState } from 'react'
import { MdRefresh } from 'react-icons/md'
import { useStore } from '../store.jsx'
import { parseNodeAddress, probeBase, explainProbe, toHttp, DEFAULT_NODE_PORT } from '../api.js'
import { tile, inputBase, PrimaryButton, StatusDot, Section } from '../ui.jsx'

const STATUS_TEXT = { connected: 'Online', checking: 'Checking…', disconnected: 'Offline' }

function describe(conn) {
  const bits = [STATUS_TEXT[conn.status]]
  if (conn.status === 'connected') {
    if (conn.latencyMs != null) bits.push(`${conn.latencyMs} ms`)
    if (conn.modelCount != null) bits.push(`${conn.modelCount} model${conn.modelCount === 1 ? '' : 's'}`)
  }
  return bits.join(' · ')
}

const secondaryButton =
  'rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-medium text-[#EDEFF4] transition-colors hover:border-white/20 disabled:opacity-40 disabled:cursor-not-allowed'

export default function Connection() {
  const { apiUrl, nodeUrl, target, connectNode, disconnectNode, connection, recheck } = useStore()

  const publicBase = toHttp(apiUrl)
  const usingNode = target.kind === 'node'

  const [draft, setDraft] = useState(target.base)
  const [test, setTest] = useState(null) // null | { state: 'running' } | { state: 'done', probe }
  const [notice, setNotice] = useState('')

  const parsed = useMemo(() => (draft.trim() ? parseNodeAddress(draft) : null), [draft])
  const valid = !!parsed && !parsed.error
  const unchanged = valid && parsed.url === target.base
  const isPublicAddress = valid && parsed.url === publicBase

  useEffect(() => setTest(null), [draft])
  // Keep the field in step if the address changes from somewhere else.
  useEffect(() => setDraft(target.base), [target.base])

  const flash = (text) => {
    setNotice(text)
    setTimeout(() => setNotice(''), 4000)
  }

  const runTest = async () => {
    if (!valid) return
    setTest({ state: 'running' })
    setTest({ state: 'done', probe: await probeBase(parsed.url) })
  }

  const save = () => {
    if (!valid || unchanged) return
    if (isPublicAddress) {
      disconnectNode()
      flash('Requests now go to the public network.')
    } else {
      connectNode(parsed.url)
      flash('Requests now go to your node.')
    }
    setDraft(parsed.url)
  }

  const usePublic = () => {
    disconnectNode()
    setDraft(publicBase)
    flash('Requests now go to the public network.')
  }

  return (
    <>
      <Section label="Connection" accent="#4FD8C4">
        <h2 className="font-bold text-lg text-[#EDEFF4] mb-1">API address</h2>
        <p className="text-sm text-[#8B93A7] mb-4">
          Where requests go. By default that's the public Tensorlink network. Enter your own node's IP address or URL to
          send them straight from this browser to your node instead. Chats are stored only in this browser either way.
        </p>

        {/* What it's doing right now */}
        <div className={`${tile} mb-4 flex items-center justify-between gap-3 px-4 py-3`}>
          <div className="flex min-w-0 items-center gap-2">
            <StatusDot status={connection.status} />
            <div className="min-w-0">
              <p className="text-sm text-[#EDEFF4]">{usingNode ? 'Your node' : 'Public network'}</p>
              <p className="truncate font-mono text-[11px] text-[#8B93A7]">{target.base}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="text-xs text-[#8B93A7]">{describe(connection)}</span>
            <button
              onClick={recheck}
              title="Check again"
              aria-label="Check connection again"
              className="rounded-lg border border-white/10 bg-white/[0.03] p-1.5 text-[#8B93A7] hover:border-white/20"
            >
              <MdRefresh size={14} />
            </button>
          </div>
        </div>
        {connection.status === 'disconnected' && connection.error && (
          <p className="-mt-2 mb-4 text-xs text-amber-300/90">{explainProbe(connection.error, { node: usingNode })}</p>
        )}
        {usingNode && connection.status === 'disconnected' && (
          <p className="-mt-2 mb-4 text-xs text-amber-300/90">Requests won't fall back to the public network while your node is unreachable.</p>
        )}

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && save()}
            placeholder={`192.168.1.20 or https://node.example.com`}
            aria-label="API address"
            spellCheck={false}
            className={`${inputBase} flex-1 font-mono text-xs`}
          />
          <PrimaryButton onClick={save} disabled={!valid || unchanged} className="!rounded-lg">
            Save
          </PrimaryButton>
        </div>

        {parsed?.error && <p className="mt-2 text-xs text-red-300">{parsed.error}</p>}
        {valid && !unchanged && (
          <p className="mt-2 text-xs text-[#8B93A7]">
            {isPublicAddress ? 'This is the public network.' : 'Will connect to'}{' '}
            {!isPublicAddress && <span className="font-mono text-[#EDEFF4]">{parsed.url}</span>}
          </p>
        )}
        {valid &&
          parsed.warnings.map((w) => (
            <p key={w.message} className={`mt-2 text-xs ${w.level === 'warn' ? 'text-amber-300/90' : 'text-[#8B93A7]'}`}>
              {w.message}
            </p>
          ))}
        {!draft.trim() && (
          <p className="mt-2 text-xs text-[#5B6272]">A bare IP address uses port {DEFAULT_NODE_PORT}. Add a port or paste a full URL to use something else.</p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button onClick={runTest} disabled={!valid || test?.state === 'running'} className={secondaryButton}>
            {test?.state === 'running' ? 'Testing…' : 'Test connection'}
          </button>
          {usingNode && (
            <button onClick={usePublic} className={secondaryButton}>
              Use public network
            </button>
          )}
        </div>

        {test?.state === 'done' && (
          <div
            className={`mt-3 rounded-lg border px-3 py-2 text-xs ${
              test.probe.ok ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300' : 'border-amber-400/30 bg-amber-400/10 text-amber-200'
            }`}
          >
            {test.probe.ok
              ? `Reachable${test.probe.latencyMs != null ? ` in ${test.probe.latencyMs} ms` : ''}${
                  test.probe.modelCount != null ? ` · ${test.probe.modelCount} model${test.probe.modelCount === 1 ? '' : 's'} loaded` : ''
                }.`
              : explainProbe(test.probe, { node: !isPublicAddress })}
          </div>
        )}
      </Section>

      {notice && (
        <div className="rounded-lg border border-[#4FD8C4]/30 bg-[#4FD8C4]/10 px-3 py-2.5 text-sm text-emerald-300 text-center">{notice}</div>
      )}
    </>
  )
}
