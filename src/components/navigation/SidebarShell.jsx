import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { MdChatBubbleOutline, MdMenuBook } from 'react-icons/md'
import Sidebar from './Sidebar.jsx'
import { BLUR, blurFade } from '../../transitions'

// Keep in sync with the `w-[270px]` class below (the pull tab and page padding use it).
export const SIDEBAR_WIDTH = 270

// Segmented control switching the sidebar between chat history and the site nav.
function SidebarTabs({ tab, onChange }) {
  const tabs = [
    { id: 'chats', label: 'Chats', icon: MdChatBubbleOutline },
    { id: 'docs', label: 'Home', icon: MdMenuBook },
  ]
  return (
    <div className="mx-3 mb-3 flex rounded-lg border border-white/10 bg-white/[0.02] p-1">
      {tabs.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-colors ${
            tab === id ? 'bg-[#4FD8C4]/15 text-[#4FD8C4]' : 'text-[#8B93A7] hover:text-[#EDEFF4]'
          }`}
        >
          <Icon size={14} />
          {label}
        </button>
      ))}
    </div>
  )
}

/**
 * The one sidebar used by both the landing/docs layout and the chat app.
 *
 *  - Landing/docs: <SidebarShell open={...} />  -> logo + site nav, no tabs.
 *  - Chat app:     pass `onTabChange` (+ `tab`, `chatsContent`) to get the Chats/Home tabs.
 *
 * Slides in/out when `open` changes and blurs in/out on route transitions.
 */
export default function SidebarShell({ open = true, tab = 'docs', onTabChange, chatsContent, onScroll, style }) {
  const showTabs = !!onTabChange
  const restX = open ? 0 : '-100%'

  return (
    <motion.aside
      onScroll={onScroll}
      initial={{ opacity: 0, filter: BLUR, x: restX, visibility: open ? 'visible' : 'hidden' }}
      animate={{
        opacity: 1,
        filter: 'blur(0px)',
        x: restX,
        visibility: 'visible',
        transitionEnd: { filter: 'none', ...(open ? {} : { visibility: 'hidden' }) },
      }}
      exit={{ opacity: 0, filter: BLUR }}
      transition={blurFade.transition}
      style={style}
      className="fixed inset-y-0 left-0 z-40 w-[270px] shrink-0 overflow-y-auto overflow-x-hidden border-r border-white/10 bg-[#0d1017]"
    >
      <div className="px-4 pt-5 pb-4">
        <Link to="/home" className="text-lg font-bold text-[#EDEFF4] hover:text-[#4FD8C4] transition-colors">
          tensorlink.io
        </Link>
      </div>

      {showTabs && <SidebarTabs tab={tab} onChange={onTabChange} />}

      {showTabs ? (
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={tab} {...blurFade}>
            {tab === 'chats' ? chatsContent : <Sidebar />}
          </motion.div>
        </AnimatePresence>
      ) : (
        <Sidebar />
      )}
    </motion.aside>
  )
}
