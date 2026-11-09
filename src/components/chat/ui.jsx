export const card =
  'rounded-2xl border border-gray-200 dark:border-white/10 bg-white/60 dark:bg-white/[0.02] backdrop-blur-sm shadow-sm'

export const tile =
  'rounded-xl border border-gray-200 dark:border-white/10 bg-white/70 dark:bg-white/[0.02] backdrop-blur-sm'

export const inputBase =
  'w-full rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.03] px-3 py-2 text-sm text-gray-900 dark:text-[#EDEFF4] placeholder:text-gray-400 dark:placeholder:text-[#5B6272] focus:outline-none focus:ring-2 focus:ring-[#4FD8C4]/40 focus:border-[#4FD8C4]/40'

export const ACCENTS = {
  teal: '#4FD8C4',
  purple: '#A78BFA',
  blue: '#60A5FA',
  amber: '#F59E0B',
  pink: '#F472B6',
  green: '#34D399',
}

export function Eyebrow({ label, accent = ACCENTS.teal }) {
  return (
    <div className="flex items-center gap-2 mb-1.5">
      <span className="h-px w-4" style={{ backgroundImage: `linear-gradient(to right, transparent, ${accent})` }} />
      <span className="text-[10px] tracking-[0.25em] uppercase text-gray-400 dark:text-[#8B93A7]">{label}</span>
    </div>
  )
}

export function IconButton({ children, className = '', ...props }) {
  return (
    <button
      className={`rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.03] p-2 text-gray-500 dark:text-[#8B93A7] transition-colors hover:border-gray-300 dark:hover:border-white/20 disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export function PrimaryButton({ children, className = '', ...props }) {
  return (
    <button
      className={`rounded-full bg-[#4FD8C4] px-4 py-2 text-sm font-medium text-[#0A0D13] transition-colors hover:bg-[#6EE2D1] disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export function StatusDot({ status }) {
  // status: 'connected' | 'checking' | 'disconnected'
  const color = status === 'connected' ? 'bg-emerald-400' : status === 'checking' ? 'bg-amber-400' : 'bg-gray-400 dark:bg-white/20'
  const pulse = status !== 'disconnected'
  return (
    <span className="relative flex h-2 w-2 items-center justify-center shrink-0">
      {pulse && (
        <span className={`absolute h-2 w-2 rounded-full ${color} animate-ping opacity-60`} />
      )}
      <span className={`relative h-1.5 w-1.5 rounded-full ${color}`} />
    </span>
  )
}

export function Spinner({ className = 'h-8 w-8' }) {
  return <div className={`animate-spin rounded-full border-b-2 border-[#4FD8C4] ${className}`} />
}

export function Section({ label, accent, children }) {
  return (
    <div className={`${card} p-4 sm:p-6 mb-4`}>
      <Eyebrow label={label} accent={accent} />
      {children}
    </div>
  )
}

export function Toggle({ checked, onChange, label, description, disabled }) {
  return (
    <div className={`flex items-start justify-between gap-4 py-3 ${disabled ? 'opacity-50' : ''}`}>
      <div className="min-w-0">
        <p className="text-sm font-medium text-[#EDEFF4]">{label}</p>
        {description && <p className="mt-0.5 text-xs text-[#8B93A7]">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors disabled:cursor-not-allowed ${checked ? 'bg-[#4FD8C4]' : 'bg-white/15'}`}
      >
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${checked ? 'left-[18px]' : 'left-0.5'}`} />
      </button>
    </div>
  )
}
