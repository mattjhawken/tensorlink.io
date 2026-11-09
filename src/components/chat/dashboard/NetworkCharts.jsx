import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MdKeyboardArrowDown } from 'react-icons/md'
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Filler } from 'chart.js'
import { Line, Doughnut } from 'react-chartjs-2'
import { card } from '../ui.jsx'
import { CHART_TYPES, CHART_META, RANGE_OPTIONS, MAX_GPU_TREND_SERIES, buildCharts, formatBytes, formatDay } from './networkChartData.js'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Filler)

const AXIS = 'rgba(255, 255, 255, 0.55)'
const GRID = 'rgba(255, 255, 255, 0.08)'
const LEGEND = '#EDEFF4'
const TOOLTIP = { backgroundColor: 'rgba(0, 0, 0, 0.8)', titleColor: '#fff', bodyColor: '#fff', borderColor: '#374151', borderWidth: 1 }

const legend = (position = 'top') => ({
  position,
  labels: { usePointStyle: true, padding: 12, boxWidth: 6, boxHeight: 6, font: { size: 12 }, color: LEGEND },
})

function lineOptions({ stacked = false, showLegend = true, integer = false, beginAtZero = false, yTick, tooltipLabel } = {}) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: showLegend ? legend() : { display: false },
      tooltip: { ...TOOLTIP, callbacks: tooltipLabel ? { label: tooltipLabel } : {} },
    },
    scales: {
      x: { stacked, grid: { color: GRID }, ticks: { color: AXIS, font: { size: 11 }, maxTicksLimit: 10 } },
      y: {
        stacked,
        beginAtZero,
        grid: { color: GRID },
        ticks: { color: AXIS, font: { size: 11 }, ...(integer && { precision: 0 }), ...(yTick && { callback: yTick }) },
      },
    },
    elements: { point: { radius: 2, hoverRadius: 5 } },
    animation: { duration: 700, easing: 'easeInOutQuart' },
    interaction: { intersect: false, mode: 'index' },
  }
}

const doughnutOptions = () => ({
  responsive: true,
  maintainAspectRatio: false,
  cutout: '62%',
  plugins: {
    legend: legend(typeof window !== 'undefined' && window.innerWidth < 640 ? 'bottom' : 'right'),
    tooltip: {
      ...TOOLTIP,
      callbacks: {
        label: (ctx) => {
          const total = ctx.dataset.data.reduce((s, v) => s + v, 0)
          return `${ctx.label}: ${ctx.parsed} (${total ? ((ctx.parsed / total) * 100).toFixed(1) : '0.0'}%)`
        },
      },
    },
  },
  animation: { duration: 700 },
})

const OPTIONS = {
  [CHART_TYPES.PARTICIPANTS]: () => lineOptions({ integer: true }),
  [CHART_TYPES.JOBS]: () => lineOptions({ integer: true, showLegend: false }),
  [CHART_TYPES.CAPACITY]: () =>
    lineOptions({
      stacked: true,
      yTick: (v) => formatBytes(Number(v), 0),
      tooltipLabel: (ctx) => `${ctx.dataset.label}: ${formatBytes(ctx.parsed.y)}`,
    }),
  [CHART_TYPES.GPU_BREAKDOWN]: doughnutOptions,
  [CHART_TYPES.GPU_TREND]: () => lineOptions({ stacked: true, integer: true, beginAtZero: true }),
}

const SPARK_LINE = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { enabled: false } },
  scales: { x: { display: false }, y: { display: false } },
  elements: { point: { radius: 0 }, line: { borderWidth: 2 } },
  animation: false,
}
const SPARK_DOUGHNUT = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '65%',
  plugins: { legend: { display: false }, tooltip: { enabled: false } },
  animation: false,
}

function Chart({ type, ...props }) {
  return type === 'doughnut' ? <Doughnut {...props} /> : <Line {...props} />
}

function Stat({ value, children }) {
  return (
    <span>
      <span className="font-medium text-[#EDEFF4]">{value}</span> {children}
    </span>
  )
}

export default function NetworkCharts({ history }) {
  const [selected, setSelected] = useState(CHART_TYPES.PARTICIPANTS)
  const [rangeDays, setRangeDays] = useState(90)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!menuOpen) return
    const onDown = (e) => menuRef.current && !menuRef.current.contains(e.target) && setMenuOpen(false)
    const onKey = (e) => e.key === 'Escape' && setMenuOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  const charts = useMemo(() => buildCharts(history, rangeDays), [history, rangeDays])

  if (!history) {
    return (
      <div className={`${card} p-6 text-center`}>
        <p className="text-sm text-[#8B93A7]">Network history isn't available from this server.</p>
      </div>
    )
  }

  const meta = CHART_META[selected]
  const active = charts[selected]
  const isBreakdown = selected === CHART_TYPES.GPU_BREAKDOWN
  const snap = charts[CHART_TYPES.GPU_BREAKDOWN].snapshot
  // react-chartjs-2 doesn't always redraw in place when the point count changes, so remount on change.
  const version = (c) => c.data?.labels?.length ?? 0

  return (
    <div className={`${card} p-4 sm:p-6`}>
      {/* Title + chart picker */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-[#EDEFF4]">{meta.label}</h3>
          <p className="mt-0.5 text-xs text-[#8B93A7]">{meta.description}</p>
        </div>

        <div className="relative shrink-0" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            aria-haspopup="listbox"
            aria-expanded={menuOpen}
            className="flex w-full items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-medium text-[#EDEFF4] transition-colors hover:border-white/20 sm:w-[200px]"
          >
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: meta.accent }} />
              {meta.label}
            </span>
            <MdKeyboardArrowDown className={`text-[#5B6272] transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
          </button>
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                role="listbox"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 z-20 mt-2 w-full overflow-hidden rounded-lg border border-white/10 bg-[#12151c] shadow-xl shadow-black/40 sm:w-[200px]"
              >
                {Object.entries(CHART_META).map(([key, m]) => (
                  <button
                    key={key}
                    role="option"
                    aria-selected={selected === key}
                    onClick={() => {
                      setSelected(key)
                      setMenuOpen(false)
                    }}
                    className={`flex w-full items-center gap-2 px-4 py-2 text-left text-sm transition-colors ${
                      selected === key ? 'bg-white/[0.06] font-medium text-[#EDEFF4]' : 'text-[#9AA2B4] hover:bg-white/[0.04]'
                    }`}
                  >
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: m.accent }} />
                    {m.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Range (the breakdown is a snapshot, not a series) */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {isBreakdown ? (
          <span className="text-xs text-[#5B6272]">
            {snap?.date ? `Latest benchmark data · ${formatDay(snap.date)}` : 'Current snapshot'}
          </span>
        ) : (
          <div role="group" aria-label="Date range" className="inline-flex items-center gap-0.5 rounded-full border border-white/10 bg-white/[0.03] p-0.5">
            {RANGE_OPTIONS.map((o) => (
              <button
                key={o.value}
                onClick={() => setRangeDays(o.value)}
                aria-pressed={rangeDays === o.value}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  rangeDays === o.value ? 'bg-white/10 text-[#EDEFF4]' : 'text-[#8B93A7] hover:text-[#EDEFF4]'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Featured chart */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selected}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="flex h-[360px] flex-col rounded-xl border bg-white/[0.015] p-4 sm:h-[420px] sm:p-5"
          style={{ borderColor: `${meta.accent}40` }}
        >
          {active.data ? (
            <>
              <div className="min-h-0 flex-1">
                <Chart key={`${selected}-${version(active)}`} type={active.type} data={active.data} options={OPTIONS[selected]()} />
              </div>

              {isBreakdown && snap && (
                <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 border-t border-white/5 pt-3 text-xs text-[#8B93A7]">
                  {typeof snap.total_benchmarked === 'number' && <Stat value={snap.total_benchmarked}>devices benchmarked</Stat>}
                  {typeof snap.avg_tflops === 'number' && <Stat value={snap.avg_tflops.toFixed(1)}>avg TFLOPS</Stat>}
                  {typeof snap.avg_bandwidth_gb_s === 'number' && <Stat value={snap.avg_bandwidth_gb_s.toFixed(0)}>avg GB/s memory bandwidth</Stat>}
                </div>
              )}

              {isBreakdown && active.vendors && (
                <div className="mt-3 border-t border-white/5 pt-3">
                  <div className="flex h-2 w-full overflow-hidden rounded-full bg-white/5">
                    {active.vendors.map((v) => (
                      <div key={v.label} style={{ width: `${(v.count / active.vendors.reduce((s, x) => s + x.count, 0)) * 100}%`, backgroundColor: v.color }} title={`${v.label}: ${v.count}`} />
                    ))}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                    {active.vendors.map((v) => {
                      const total = active.vendors.reduce((s, x) => s + x.count, 0)
                      return (
                        <span key={v.label} className="flex items-center gap-1.5 text-xs text-[#8B93A7]">
                          <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: v.color }} />
                          {v.label}: {v.count} ({Math.round((v.count / total) * 100)}%)
                        </span>
                      )
                    })}
                  </div>
                </div>
              )}

              {selected === CHART_TYPES.GPU_TREND && (active.dayCount < rangeDays || active.hasOther) && (
                <p className="mt-3 border-t border-white/5 pt-3 text-xs text-[#8B93A7]">
                  {active.dayCount < rangeDays && `The server returned ${active.dayCount} days of per-GPU history. `}
                  {active.hasOther && `Top ${MAX_GPU_TREND_SERIES} of ${active.totalModels} models shown; the rest are grouped as Other.`}
                </p>
              )}
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-[#5B6272]">
              {selected === CHART_TYPES.GPU_BREAKDOWN || selected === CHART_TYPES.GPU_TREND ? 'No GPU benchmark data reported yet.' : 'No data available'}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Clickable previews */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {Object.entries(CHART_META).map(([key, m]) => {
          const c = charts[key]
          const on = selected === key
          return (
            <button
              key={key}
              onClick={() => setSelected(key)}
              aria-pressed={on}
              className={`rounded-lg border p-3 text-left transition-colors ${on ? '' : 'border-white/10 hover:border-white/20'}`}
              style={on ? { borderColor: m.accent, backgroundColor: `${m.accent}0D` } : undefined}
            >
              <div className="mb-2 flex items-center justify-between">
                <span className={`text-xs font-medium ${on ? 'text-[#EDEFF4]' : 'text-[#8B93A7]'}`}>{m.label}</span>
                <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: m.accent }} />
              </div>
              <div className="h-12 sm:h-14">
                {c.data ? (
                  <Chart key={`${key}-${version(c)}`} type={c.type} data={c.data} options={c.type === 'doughnut' ? SPARK_DOUGHNUT : SPARK_LINE} />
                ) : (
                  <div className="flex h-full items-center justify-center text-[10px] text-[#3B4152]">—</div>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
