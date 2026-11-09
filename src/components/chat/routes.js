import { MdChat, MdDashboard } from 'react-icons/md'
import Chat from './Chat.jsx'
import Dashboard from './Dashboard.jsx'

/**
 * Every top-level page of the app. The shell renders whichever entry matches the current view,
 * so adding a page means adding an entry here.
 *
 *   id         key stored as the current view
 *   label      name shown on buttons
 *   icon       react-icons component
 *   component  the page; receives { routes, onLaunch, onNavigateToSettings }
 *   nav        show an icon button in the sidebar header
 *   launcher   { description }: show a tile on the dashboard overview that opens this page
 */
export const ROUTES = [
  {
    id: 'chat',
    label: 'Chat',
    icon: MdChat,
    component: Chat,
    launcher: { description: 'Talk to a model on your node or the public network.' },
  },
  { id: 'dashboard', label: 'Dashboard', icon: MdDashboard, component: Dashboard, nav: true },
]
