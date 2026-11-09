import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { MdBolt, MdVerifiedUser, MdWork, MdStorage, MdSort, MdCircle, MdRefresh } from 'react-icons/md'
import { useStore } from '../store.jsx'
import { fetchMetrics, explainProbe } from '../api.js'
import { card, tile, Eyebrow, Spinner, StatusDot, ACCENTS } from '../ui.jsx'
import NetworkCharts from './NetworkCharts.jsx'
import { formatBytes } from './networkChartData.js'

const REFRESH_MS = 30_000
const EMPTY = { history: null, demand: null, stats: null }

function formatTimeAgo(timestamp) {
  const diff = Date.now() / 1000 - timestamp
  if (diff < 60) return 'Just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function formatModelName(fullName) {
  const parts = fullName.split('/')
  return parts.length > 1 ? parts[1] : fullName
}

function StatCard({ icon, label, value, accent, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={`${tile} flex items-center gap-3 px-4 py-3`}
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-lg shrink-0" style={{ backgroundColor: `${accent}1A`, color: accent }}>
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-lg font-semibold text-[#EDEFF4] leading-tight truncate">{value}</p>
        <p className="text-xs text-[#8B93A7]">{label}</p>
      </div>
    </motion.div>
  )
}

function ModelDemandList({ data, loading }) {
  const [sortBy, setSortBy] = useState('total_requests')
  const [sortOrder, setSortOrder] = useState('desc')

  const models = useMemo(() => {
    const list = data?.data?.popular_models || []
    return [...list].sort((a, b) => {
      let av = a[sortBy]
      let bv = b[sortBy]
      if (sortBy === 'model_name') {
        av = formatModelName(av).toLowerCase()
        bv = formatModelName(bv).toLowerCase()
        return sortOrder === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
      }
      return sortOrder === 'asc' ? av - bv : bv - av
    })
  }, [data, sortBy, sortOrder])

  const handleSort = (col) => {
    if (sortBy === col) setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'))
    else {
      setSortBy(col)
      setSortOrder('desc')
    }
  }

  if (loading) {
    return (
      <div className={`${card} p-6 flex items-center justify-center min-h-[200px]`}>
        <Spinner />
      </div>
    )
  }

  if (!models.length) {
    return (
      <div className={`${card} p-6 flex flex-col items-center justify-center min-h-[160px] text-center`}>
        <MdBolt className="text-3xl text-[#3B4152] mb-2" />
        <p className="text-sm text-[#8B93A7]">No model demand data available yet.</p>
      </div>
    )
  }

  return (
    <div className={`${card} overflow-hidden`}>
      <div className="hidden sm:grid grid-cols-12 gap-2 px-4 py-2.5 border-b border-white/10 text-[10px] tracking-[0.15em] uppercase text-[#8B93A7]">
        <button className="col-span-5 text-left flex items-center gap-1 hover:text-[#EDEFF4]" onClick={() => handleSort('model_name')}>
          Model <MdSort size={12} />
        </button>
        <button className="col-span-2 text-center hover:text-[#EDEFF4]" onClick={() => handleSort('total_requests')}>
          Total
        </button>
        <button className="col-span-2 text-center hover:text-[#EDEFF4]" onClick={() => handleSort('recent_requests')}>
          Recent
        </button>
        <span className="col-span-3 text-right">Last used</span>
      </div>
      <div className="divide-y divide-white/5">
        {models.map((m) => (
          <div key={m.model_name} className="grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-2 px-4 py-2.5 text-sm">
            <div className="sm:col-span-5 flex items-center gap-2 min-w-0">
              {m.has_distribution && <MdCircle className="text-emerald-400 shrink-0" size={7} />}
              <span className="truncate font-medium text-[#EDEFF4]">{formatModelName(m.model_name)}</span>
            </div>
            <div className="sm:col-span-2 sm:text-center text-xs text-[#9AA2B4]">
              <span className="sm:hidden text-[#5B6272]">Total: </span>
              {m.total_requests}
            </div>
            <div className="sm:col-span-2 sm:text-center text-xs text-[#9AA2B4]">
              <span className="sm:hidden text-[#5B6272]">Recent: </span>
              {m.recent_requests}
            </div>
            <div className="sm:col-span-3 sm:text-right text-xs text-[#5B6272]">{formatTimeAgo(m.last_accessed)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Overview({ routes = [], onLaunch, onOpenSection }) {
  const { target, connection: route } = useStore()
  const usingNode = target.kind === 'node'

  const [data, setData] = useState(EMPTY)
  const [loading, setLoading] = useState(true)
  const reqId = useRef(0)

  const load = useCallback(
    async (silent) => {
      const id = ++reqId.current
      if (!silent) {
        setLoading(true)
        setData(EMPTY)
      }
      const metrics = await fetchMetrics(target.base)
      if (id !== reqId.current) return
      setData(metrics)
      setLoading(false)
    },
    [target.base]
  )

  useEffect(() => {
    load(false)
    const t = setInterval(() => load(true), REFRESH_MS)
    return () => {
      clearInterval(t)
      reqId.current++
    }
  }, [load])

  const { history, demand, stats } = data
  // /stats has been served both flat ({ workers, ... }) and wrapped ({ current: { workers, ... } }).
  const current = stats?.current ?? stats
  const launchers = routes.filter((r) => r.launcher)

  return (
    <div className="px-3 sm:px-6 py-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <Eyebrow label="Tensorlink" />
        <h1 className="text-2xl font-bold text-[#EDEFF4]">Dashboard</h1>
      </div>

      {/* Where requests are going */}
      <div className={`${card} mb-6 p-4 sm:p-5`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <span className="mt-1.5"><StatusDot status={route.status} /></span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-[#EDEFF4]">
                {usingNode ? 'Requests go to your node' : 'Requests go to the public network'}
              </p>
              <p className="mt-0.5 text-xs text-[#8B93A7]">
                {route.status === 'connected'
                  ? [
                      'Online',
                      route.latencyMs != null && `${route.latencyMs} ms`,
                      route.modelCount != null && `${route.modelCount} model${route.modelCount === 1 ? '' : 's'}`,
                    ]
                      .filter(Boolean)
                      .join(' · ')
                  : route.status === 'checking'
                    ? 'Checking…'
                    : explainProbe(route.error, { node: usingNode }) || 'Offline'}
              </p>
              {usingNode && route.status === 'disconnected' && (
                <p className="mt-1 text-xs text-amber-300/90">Requests won't fall back to the public network while your node is unreachable.</p>
              )}
              {!usingNode && (
                <p className="mt-1 text-xs text-[#5B6272]">
                  Your chats stay in this browser. Add your own node to keep requests off the public network too.
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => onOpenSection?.('connection')}
            className="shrink-0 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-[#EDEFF4] transition-colors hover:border-white/20"
          >
            {usingNode ? 'Manage' : 'Connect a node'}
          </button>
        </div>
      </div>

      {launchers.length > 0 && (
        <div className="mb-2 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {launchers.map((r) => (
            <button
              key={r.id}
              onClick={() => onLaunch?.(r.id)}
              className={`${tile} flex items-center gap-3 px-4 py-3 text-left transition-colors hover:border-white/20`}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${ACCENTS.teal}1A`, color: ACCENTS.teal }}>
                <r.icon size={18} />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium text-[#EDEFF4]">{r.label}</span>
                <span className="block text-xs text-[#8B93A7]">{r.launcher.description}</span>
              </span>
            </button>
          ))}
        </div>
      )}

      <div className="mb-1 flex justify-end">
        <button
          onClick={() => load(false)}
          title="Refresh"
          aria-label="Refresh metrics"
          className="rounded-lg border border-white/10 bg-white/[0.03] p-2 text-[#8B93A7] hover:border-white/20"
        >
          <MdRefresh size={16} />
        </button>
      </div>

      {/* Models */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-[#EDEFF4] mb-3">Active models</h2>
        <ModelDemandList data={demand} loading={loading} />
        <p className="text-xs text-[#5B6272] mt-2">
            Don't see your model?{' '}
            <button onClick={() => onOpenSection?.('models')} className="text-[#4FD8C4] hover:text-[#6EE2D1] underline underline-offset-2">
              Request one
            </button>
          </p>
      </div>

      {/* Statistics */}
      <div>
        <h2 className="text-lg font-semibold text-[#EDEFF4] mb-3">Network statistics</h2>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
          <StatCard icon={<MdWork size={18} />} label="Workers" value={current?.workers ?? '—'} accent={ACCENTS.teal} delay={0} />
          <StatCard icon={<MdVerifiedUser size={18} />} label="Validators" value={current?.validators ?? '—'} accent={ACCENTS.green} delay={0.05} />
          <StatCard icon={<MdBolt size={18} />} label="Jobs" value={current?.jobs ?? '—'} accent={ACCENTS.purple} delay={0.1} />
          <StatCard
            icon={<MdStorage size={18} />}
            label="Capacity"
            value={current?.available_capacity != null || current?.used_capacity != null ? formatBytes((current.available_capacity || 0) + (current.used_capacity || 0)) : '—'}
            accent={ACCENTS.blue}
            delay={0.15}
          />
        </div>

        {loading ? (
          <div className={`${card} h-64 flex items-center justify-center`}>
            <Spinner />
          </div>
        ) : (
          <NetworkCharts history={history} />
        )}
      </div>
    </div>
  )
}
