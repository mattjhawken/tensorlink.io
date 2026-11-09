import { useStore } from './store.jsx'
import Overview from './dashboard/Overview.jsx'
import Connection from './dashboard/Connection.jsx'
import Models from './dashboard/Models.jsx'
import ChatDefaults from './dashboard/ChatDefaults.jsx'

// Sections of the dashboard. Overview needs the full width; the rest are forms.
const SECTIONS = [
  { id: 'overview', label: 'Overview', component: Overview, wide: true },
  { id: 'connection', label: 'Connection', component: Connection },
  { id: 'models', label: 'Models', component: Models },
  { id: 'chat', label: 'Chat', component: ChatDefaults },
]

export default function Dashboard({ routes, onLaunch }) {
  const { dashSection, setDashSection } = useStore()
  const section = SECTIONS.find((s) => s.id === dashSection) ?? SECTIONS[0]
  const Body = section.component

  return (
    <div>
      <div className="border-b border-white/10">
        <div role="tablist" aria-label="Dashboard sections" className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-3 py-2 sm:px-6">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              role="tab"
              aria-selected={s.id === section.id}
              onClick={() => setDashSection(s.id)}
              className={`shrink-0 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                s.id === section.id ? 'bg-[#4FD8C4]/15 text-[#4FD8C4]' : 'text-[#8B93A7] hover:text-[#EDEFF4]'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {section.wide ? (
        <Body routes={routes} onLaunch={onLaunch} onOpenSection={setDashSection} />
      ) : (
        <div className="mx-auto max-w-3xl px-3 py-6 sm:px-6">
          <Body />
        </div>
      )}
    </div>
  )
}
