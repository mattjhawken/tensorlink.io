import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { MdBolt, MdVerifiedUser, MdWork, MdStorage, MdSort, MdCircle } from 'react-icons/md'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { useStore } from './store.jsx'
import { fetchNetworkHistory, fetchModelDemand, fetchNodeStats } from './api.js'
import { card, tile, Eyebrow, PrimaryButton, Spinner, ACCENTS } from './ui.jsx'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler)

function formatBytes(bytes) {
  if (!bytes) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
}

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

const axisColor = 'rgba(255, 255, 255, 0.55)'
const gridColor = 'rgba(255, 255, 255, 0.08)'
const legendColor = '#EDEFF4'

const baseChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
      labels: { usePointStyle: true, padding: 10, boxWidth: 6, boxHeight: 6, font: { size: 11 }, color: legendColor },
    },
  },
  scales: {
    x: { grid: { color: gridColor }, ticks: { color: axisColor, font: { size: 10 } } },
    y: { grid: { color: gridColor }, ticks: { color: axisColor, font: { size: 10 } } },
  },
  elements: { point: { radius: 0, hoverRadius: 4 } },
  animation: { duration: 700, easing: 'easeInOutQuart' },
  interaction: { intersect: false, mode: 'index' },
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

export default function Home({ onStartChat, onNavigateToSettings }) {
  const { apiUrl } = useStore()
  const [history, setHistory] = useState(null)
  const [demand, setDemand] = useState(null)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        setLoading(true)
        const [h, d, s] = await Promise.all([
          fetchNetworkHistory(apiUrl, 90).catch(() => null),
          fetchModelDemand(apiUrl).catch(() => null),
          fetchNodeStats(apiUrl).catch(() => null),
        ])
        if (!cancelled) {
          setHistory(h)
          setDemand(d)
          setStats(s)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [apiUrl])

  const dateLabels = (labels) => labels.map((d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))

  const participantsData = useMemo(() => {
    if (!history?.daily) return null
    const { labels, datasets } = history.daily
    return {
      labels: dateLabels(labels),
      datasets: [
        { label: 'Validators', data: datasets.validators, borderColor: ACCENTS.green, backgroundColor: `${ACCENTS.green}1A`, fill: true, tension: 0.4 },
        { label: 'Workers', data: datasets.workers, borderColor: ACCENTS.teal, backgroundColor: `${ACCENTS.teal}1A`, fill: true, tension: 0.4 },
      ],
    }
  }, [history])

  const jobsData = useMemo(() => {
    if (!history?.daily) return null
    const { labels, datasets } = history.daily
    return {
      labels: dateLabels(labels),
      datasets: [{ label: 'Jobs', data: datasets.jobs, borderColor: ACCENTS.purple, backgroundColor: `${ACCENTS.purple}1A`, fill: true, tension: 0.4 }],
    }
  }, [history])

  const capacityData = useMemo(() => {
    if (!history?.daily) return null
    const { labels, datasets } = history.daily
    const free = datasets.total_capacity.map((t, i) => t - datasets.used_capacity[i])
    return {
      labels: dateLabels(labels),
      datasets: [
        { label: 'Used', data: datasets.used_capacity, borderColor: ACCENTS.blue, backgroundColor: `${ACCENTS.blue}1A`, fill: true, tension: 0.4 },
        { label: 'Free', data: free, borderColor: ACCENTS.green, backgroundColor: `${ACCENTS.green}1A`, fill: true, tension: 0.4 },
      ],
    }
  }, [history])

  const capacityOptions = useMemo(
    () => ({
      ...baseChartOptions,
      plugins: { ...baseChartOptions.plugins, tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${formatBytes(ctx.parsed.y)}` } } },
      scales: { ...baseChartOptions.scales, y: { ...baseChartOptions.scales.y, ticks: { ...baseChartOptions.scales.y.ticks, callback: (v) => formatBytes(Number(v)) } } },
    }),
    []
  )

  return (
    <div className="px-3 sm:px-6 py-6 max-w-6xl mx-auto">
      {/* Intro */}
      <div className="mb-8">
        <Eyebrow label="Tensorlink" />
        <h1 className="text-2xl font-bold text-[#EDEFF4] mb-3">Private, peer-to-peer AI</h1>
        <p className="text-sm text-[#9AA2B4] leading-relaxed mb-2 max-w-2xl">
          Tensorlink is an open-source peer-to-peer network for running AI models across distributed hardware —
          giving you access to real compute without depending on a centralized provider.
        </p>
        <p className="text-sm text-[#9AA2B4] leading-relaxed mb-5 max-w-2xl">
          Everything you type stays in your browser's local storage. Connect your own node in Settings to keep your
          requests fully private, or use the public network to get started right away.
        </p>
        <div className="flex flex-wrap gap-2">
          <PrimaryButton onClick={onStartChat}>Start chatting</PrimaryButton>
          <a
            href="https://www.smartnodes.ca/tensorlink"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-medium text-[#EDEFF4] hover:border-white/20 transition-colors"
          >
            Learn more ↗
          </a>
        </div>
      </div>

      {/* Model demand */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-[#EDEFF4] mb-3">Active models</h2>
        <ModelDemandList data={demand} loading={loading} />
        <p className="text-xs text-[#5B6272] mt-2">
          Don't see your model?{' '}
          <button onClick={onNavigateToSettings} className="text-[#4FD8C4] hover:text-[#6EE2D1] underline underline-offset-2">
            Request one in Settings
          </button>
        </p>
      </div>

      {/* Network stats */}
      <div>
        <h2 className="text-lg font-semibold text-[#EDEFF4] mb-3">Network statistics</h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <StatCard icon={<MdWork size={18} />} label="Workers" value={stats?.current?.workers ?? '—'} accent={ACCENTS.teal} delay={0} />
          <StatCard icon={<MdVerifiedUser size={18} />} label="Validators" value={stats?.current?.validators ?? '—'} accent={ACCENTS.green} delay={0.05} />
          <StatCard icon={<MdBolt size={18} />} label="Jobs" value={stats?.current?.jobs ?? '—'} accent={ACCENTS.purple} delay={0.1} />
          <StatCard
            icon={<MdStorage size={18} />}
            label="Capacity"
            value={stats?.current ? formatBytes((stats.current.available_capacity || 0) + (stats.current.used_capacity || 0)) : '—'}
            accent={ACCENTS.blue}
            delay={0.15}
          />
        </div>

        {loading ? (
          <div className={`${card} h-64 flex items-center justify-center`}>
            <Spinner />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {participantsData && (
              <div className={`${card} p-3 h-[280px]`}>
                <Line data={participantsData} options={baseChartOptions} />
              </div>
            )}
            {jobsData && (
              <div className={`${card} p-3 h-[280px]`}>
                <Line data={jobsData} options={baseChartOptions} />
              </div>
            )}
            {capacityData && (
              <div className={`${card} p-3 h-[280px]`}>
                <Line data={capacityData} options={capacityOptions} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
