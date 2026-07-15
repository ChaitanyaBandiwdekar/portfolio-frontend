import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { installEasterEggs } from './lib/easterEggs'
import { CHAT_API_URL } from './lib/chat/config'

installEasterEggs()

if (CHAT_API_URL) fetch(`${CHAT_API_URL}/health`).catch(() => {})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
