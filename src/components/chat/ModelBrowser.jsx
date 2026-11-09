import { useEffect, useMemo, useState } from 'react'
import { MdSearch, MdDownload, MdBolt } from 'react-icons/md'
import { fetchModelDemand, fetchPopularHFModels } from './api.js'
import { inputBase, tile, Spinner } from './ui.jsx'

function formatCount(n) {
  if (n === undefined || n === null) return ''
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return `${n}`
}

/**
 * Scrollable, searchable list of models pulled from two sources: the
 * Tensorlink network's own demand stats, and Hugging Face's public
 * download-ranked model list.
 */
export default function ModelBrowser({ apiUrl, onPick, selectedId }) {
  const [tab, setTab] = useState('tensorlink')
  const [query, setQuery] = useState('')
  const [tensorlinkModels, setTensorlinkModels] = useState([])
  const [hfModels, setHfModels] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.all([fetchModelDemand(apiUrl).catch(() => null), fetchPopularHFModels(40).catch(() => [])]).then(
      ([demand, hf]) => {
        if (cancelled) return
        const popular = demand?.data?.popular_models || []
        setTensorlinkModels(
          [...popular]
            .sort((a, b) => (b.total_requests || 0) - (a.total_requests || 0))
            .map((m) => ({ id: m.model_name, name: m.model_name, count: m.total_requests, live: m.has_distribution }))
        )
        setHfModels(hf.map((m) => ({ id: m.id, name: m.id, count: m.downloads })))
        setLoading(false)
      }
    )
    return () => {
      cancelled = true
    }
  }, [apiUrl])

  const list = tab === 'tensorlink' ? tensorlinkModels : hfModels

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return list
    return list.filter((m) => m.id.toLowerCase().includes(q))
  }, [list, query])

  return (
    <div>
      <div className="flex rounded-lg border border-white/10 bg-white/[0.02] p-1 mb-2">
        {[
          { id: 'tensorlink', label: 'Popular on Tensorlink' },
          { id: 'huggingface', label: 'Popular on Hugging Face' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors ${
              tab === t.id ? 'bg-[#4FD8C4]/15 text-[#4FD8C4]' : 'text-[#8B93A7] hover:text-[#EDEFF4]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="relative mb-2">
        <MdSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" size={15} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter this list…"
          className={`${inputBase} pl-8`}
        />
      </div>

      <div className={`${tile} max-h-64 overflow-y-auto divide-y divide-white/5`}>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner className="h-6 w-6" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="px-3 py-6 text-center text-xs text-[#5B6272]">No models found.</p>
        ) : (
          filtered.map((m) => (
            <button
              key={m.id}
              onClick={() => onPick(m.id)}
              className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-white/[0.06] ${
                m.id === selectedId ? 'bg-white/10' : ''
              }`}
            >
              <span className="truncate font-medium text-[#EDEFF4]">{m.name}</span>
              <span className="shrink-0 flex items-center gap-1 text-[11px] text-[#5B6272]">
                {tab === 'tensorlink' && m.live && <MdBolt className="text-emerald-400" size={12} />}
                {tab === 'huggingface' && <MdDownload size={12} />}
                {formatCount(m.count)}
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  )
}
