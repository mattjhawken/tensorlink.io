import React from "react"
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter } from 'react-router-dom'
import { ChatSettingsProvider } from "./context/ChatSettingsContext"

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ChatSettingsProvider>
        <App />
      </ChatSettingsProvider>
    </BrowserRouter>
  </React.StrictMode>,
)