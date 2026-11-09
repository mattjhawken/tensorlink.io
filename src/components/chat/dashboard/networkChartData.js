// Pure data helpers for the network analytics card. Nothing here touches React or Chart.js.

export const CHART_TYPES = {
  PARTICIPANTS: 'participants',
  JOBS: 'jobs',
  CAPACITY: 'capacity',
  GPU_BREAKDOWN: 'gpu_breakdown',
  GPU_TREND: 'gpu_trend',
}

export const CHART_META = {
  [CHART_TYPES.PARTICIPANTS]: { label: 'Participants', description: 'Workers and validators over time', accent: '#4FD8C4' },
  [CHART_TYPES.JOBS]: { label: 'Jobs', description: 'Jobs per day', accent: '#A78BFA' },
  [CHART_TYPES.CAPACITY]: { label: 'Capacity', description: 'Used and free memory across workers', accent: '#60A5FA' },
  [CHART_TYPES.GPU_BREAKDOWN]: { label: 'GPU breakdown', description: 'Benchmarked devices by model', accent: '#F59E0B' },
  [CHART_TYPES.GPU_TREND]: { label: 'GPU trend', description: 'Model mix over time', accent: '#34D399' },
}

// /network-history keeps 90 days of daily data.
export const RANGE_OPTIONS = [
  { label: '7D', value: 7 },
  { label: '30D', value: 30 },
  { label: '90D', value: 90 },
]

export const MAX_GPU_TREND_SERIES = 6

export function formatBytes(bytes, digits = 2) {
  if (!bytes) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.min(sizes.length - 1, Math.max(0, Math.floor(Math.log(bytes) / Math.log(k))))
  return `${(bytes / Math.pow(k, i)).toFixed(digits)} ${sizes[i]}`
}

// "2026-11-03" is parsed as a local date. new Date("2026-11-03") is UTC midnight and
// shows as Nov 2 anywhere west of UTC.
export function formatDay(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '')
  const d = m ? new Date(+m[1], +m[2] - 1, +m[3]) : new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function sliceDaily(daily, days) {
  if (!daily?.labels?.length) return null
  const start = Math.max(0, daily.labels.length - days)
  return {
    labels: daily.labels.slice(start),
    datasets: Object.fromEntries(Object.entries(daily.datasets || {}).map(([k, arr]) => [k, (arr || []).slice(start)])),
  }
}

export function buildLineData(labels, series, { tension = 0.4 } = {}) {
  return {
    labels,
    datasets: series.map(({ label, data, color, bg }) => ({ label, data, borderColor: color, backgroundColor: bg, fill: true, tension })),
  }
}

export const hexToRgba = (hex, alpha) => {
  const n = parseInt(hex.replace('#', ''), 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`
}

// ---------------------------------------------------------------------------
// GPU data
// ---------------------------------------------------------------------------

const GPU_PALETTE = ['#4FD8C4', '#A78BFA', '#60A5FA', '#F59E0B', '#F472B6', '#34D399', '#FB923C', '#818CF8', '#FBBF24', '#38BDF8']
const GPU_OTHER_COLOR = '#9CA3AF'

// Order matters: NVIDIA is tested before AMD so "RTX" never matches AMD's "RX ####".
const GPU_VENDORS = [
  { label: 'NVIDIA', color: '#76B900', match: /nvidia|geforce|quadro|tesla|titan|\brtx\b|\bgtx\b|\ba(?:100|800|40|30|16|10|6000|5000|4000|2000)\b|\bh(?:100|200)\b|\bl(?:4|40|40s)\b|\bv100\b/i },
  { label: 'AMD', color: '#ED1C24', match: /\bamd\b|radeon|instinct|\bmi\d{2,3}\b|\brx\s?\d{3,4}\b/i },
  { label: 'Apple Silicon', color: '#A2AAAD', match: /apple|\bm[1-4]\b(\s?(pro|max|ultra))?/i },
]
const VENDOR_OTHER = { label: 'Other', color: GPU_OTHER_COLOR }

export const classifyGpuVendor = (name) => GPU_VENDORS.find((v) => v.match.test(name || '')) || VENDOR_OTHER

export function buildVendorBreakdown(byGpuModel) {
  if (!byGpuModel) return null
  const totals = {}
  for (const [model, count] of Object.entries(byGpuModel)) {
    const v = classifyGpuVendor(model)
    totals[v.label] ??= { label: v.label, color: v.color, count: 0 }
    totals[v.label].count += count
  }
  const rows = Object.values(totals).filter((v) => v.count > 0)
  return rows.length ? rows.sort((a, b) => b.count - a.count) : null
}

/**
 * One shape for per-device history: { current, labels, datasets, gpu_model_breakdown_by_day, backend_breakdown_by_day }.
 * Uses a `device` block when the API sends one, otherwise builds the same thing from
 * summary.recent_daily (the last week, one entry per day).
 */
export function normalizeDevice(history) {
  if (history?.device?.labels?.length) return history.device
  const days = history?.summary?.recent_daily
  if (!Array.isArray(days) || !days.length) return null
  const sorted = [...days].sort((a, b) => (a.date < b.date ? -1 : 1))
  return {
    current: null,
    labels: sorted.map((d) => d.date),
    datasets: {
      avg_tflops: sorted.map((d) => d.avg_tflops ?? null),
      avg_bandwidth_gb_s: sorted.map((d) => d.avg_bandwidth_gb_s ?? null),
      total_benchmarked: sorted.map((d) => d.total_benchmarked ?? 0),
    },
    gpu_model_breakdown_by_day: Object.fromEntries(sorted.map((d) => [d.date, d.by_gpu_model || {}])),
    backend_breakdown_by_day: Object.fromEntries(sorted.map((d) => [d.date, d.by_backend || {}])),
  }
}

// Same model -> same color in the doughnut and the trend. Assigned from the sorted list of every
// model in the data, so two models can't share a color (until there are more than ten).
function buildColorOf(device) {
  const names = new Set(Object.keys(device?.current?.by_gpu_model || {}))
  for (const day of Object.values(device?.gpu_model_breakdown_by_day || {})) Object.keys(day).forEach((n) => names.add(n))
  const map = Object.fromEntries([...names].sort().map((n, i) => [n, GPU_PALETTE[i % GPU_PALETTE.length]]))
  return (model) => map[model] || GPU_OTHER_COLOR
}

// Benchmarks are sparse and today's can be empty, so fall back to the newest day that has any.
export function resolveDeviceSnapshot(device) {
  if (!device) return null
  const current = device.current ?? null
  if (current?.by_gpu_model && Object.keys(current.by_gpu_model).length) return { ...current, date: null }
  const { labels = [], gpu_model_breakdown_by_day: gpu = {}, backend_breakdown_by_day: backend = {}, datasets = {} } = device
  for (let i = labels.length - 1; i >= 0; i--) {
    const breakdown = gpu[labels[i]]
    if (breakdown && Object.keys(breakdown).length) {
      return {
        by_gpu_model: breakdown,
        by_backend: backend[labels[i]] || {},
        avg_tflops: datasets.avg_tflops?.[i] ?? null,
        avg_bandwidth_gb_s: datasets.avg_bandwidth_gb_s?.[i] ?? null,
        total_benchmarked: datasets.total_benchmarked?.[i] ?? 0,
        date: labels[i],
      }
    }
  }
  return null
}

export function buildDoughnutData(breakdown, colorOf) {
  const rows = Object.entries(breakdown || {}).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1])
  if (!rows.length) return null
  return {
    labels: rows.map(([m]) => m),
    datasets: [{ data: rows.map(([, n]) => n), backgroundColor: rows.map(([m]) => colorOf(m)), borderColor: 'transparent', hoverOffset: 6 }],
  }
}

export function buildGpuTrend(device, days, colorOf) {
  if (!device?.labels?.length) return null
  const labels = device.labels.slice(Math.max(0, device.labels.length - days))
  const byDay = device.gpu_model_breakdown_by_day || {}

  const totals = {}
  for (const date of labels) for (const [m, n] of Object.entries(byDay[date] || {})) totals[m] = (totals[m] || 0) + n
  const models = Object.keys(totals).sort((a, b) => totals[b] - totals[a])
  if (!models.length) return null

  const top = models.slice(0, MAX_GPU_TREND_SERIES)
  const rest = models.slice(MAX_GPU_TREND_SERIES)
  const series = top.map((m) => ({
    label: m,
    data: labels.map((d) => (byDay[d] || {})[m] || 0),
    color: colorOf(m),
    bg: hexToRgba(colorOf(m), 0.15),
  }))
  if (rest.length) {
    series.push({
      label: 'Other',
      data: labels.map((d) => rest.reduce((sum, m) => sum + ((byDay[d] || {})[m] || 0), 0)),
      color: GPU_OTHER_COLOR,
      bg: hexToRgba(GPU_OTHER_COLOR, 0.15),
    })
  }
  return { chartData: buildLineData(labels.map(formatDay), series, { tension: 0 }), hasOther: rest.length > 0, totalModels: models.length, dayCount: labels.length }
}

// ---------------------------------------------------------------------------
// Everything the card draws, for one range
// ---------------------------------------------------------------------------

export function buildCharts(history, days) {
  const daily = sliceDaily(history?.daily, days)
  const ds = daily?.datasets || {}
  const labels = daily ? daily.labels.map(formatDay) : []

  const participants =
    daily && ds.workers && ds.validators
      ? buildLineData(labels, [
          { label: 'Workers', data: ds.workers, color: '#4FD8C4', bg: 'rgba(79, 216, 196, 0.12)' },
          { label: 'Validators', data: ds.validators, color: '#A78BFA', bg: 'rgba(167, 139, 250, 0.12)' },
        ])
      : null

  const jobs =
    daily && ds.jobs ? buildLineData(labels, [{ label: 'Jobs', data: ds.jobs, color: '#A78BFA', bg: 'rgba(167, 139, 250, 0.12)' }]) : null

  const capacity =
    daily && ds.total_capacity && ds.used_capacity
      ? buildLineData(labels, [
          { label: 'Used', data: ds.used_capacity, color: '#60A5FA', bg: 'rgba(96, 165, 250, 0.12)' },
          { label: 'Free', data: ds.total_capacity.map((t, i) => Math.max(0, t - (ds.used_capacity[i] || 0))), color: '#34D399', bg: 'rgba(52, 211, 153, 0.12)' },
        ])
      : null

  const device = normalizeDevice(history)
  const colorOf = buildColorOf(device)
  const snapshot = resolveDeviceSnapshot(device)
  const trend = buildGpuTrend(device, days, colorOf)

  return {
    [CHART_TYPES.PARTICIPANTS]: { type: 'line', data: participants },
    [CHART_TYPES.JOBS]: { type: 'line', data: jobs },
    [CHART_TYPES.CAPACITY]: { type: 'line', data: capacity },
    [CHART_TYPES.GPU_BREAKDOWN]: {
      type: 'doughnut',
      data: buildDoughnutData(snapshot?.by_gpu_model, colorOf),
      snapshot,
      vendors: buildVendorBreakdown(snapshot?.by_gpu_model),
    },
    [CHART_TYPES.GPU_TREND]: { type: 'line', data: trend?.chartData ?? null, hasOther: !!trend?.hasOther, totalModels: trend?.totalModels ?? 0, dayCount: trend?.dayCount ?? 0 },
  }
}
