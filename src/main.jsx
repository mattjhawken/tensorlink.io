import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { StoreProvider } from './components/chat/store.jsx'
import { ContextProvider } from "./contexts/contextProvider.jsx"

// This app is dark-by-default (matching the previous chat shell), but the
// `dark` class + Tailwind's class-based dark mode is what every component
// keys off of, so flipping this later (e.g. a future theme toggle) just works.
document.documentElement.classList.add('dark')

try {
  const { pathname, search } = window.location
  if (
    pathname === '/' &&
    !new URLSearchParams(search).has('landing') &&
    localStorage.getItem('tl_used_app') === '1'
  ) {
    window.history.replaceState(null, '', '/app')
  }
} catch {
  // storage unavailable, so show the landing page as normal
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <StoreProvider>
      <ContextProvider>
        <App />
      </ContextProvider>
    </StoreProvider>
  </StrictMode>,
)
