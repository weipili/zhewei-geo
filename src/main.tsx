/* ============================================================
   显影 · 应用入口
   ============================================================ */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

import { StoreProvider } from './core/store'
import { Shell } from './ui/Shell'

import Dashboard from './pages/Dashboard'
import Audit from './pages/Audit'
import Reports from './pages/Reports'
import ReportDetail from './pages/ReportDetail'
import Compose from './pages/Compose'
import Queue from './pages/Queue'
import Channels from './pages/Channels'
import Clients from './pages/Clients'

import './styles/tokens.css'
import './styles/base.css'
import './styles/shell.css'
import './styles/report.css'

function App() {
  return (
    <Shell>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/audit" element={<Audit />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/reports/:id" element={<ReportDetail />} />
        <Route path="/compose" element={<Compose />} />
        <Route path="/queue" element={<Queue />} />
        <Route path="/channels" element={<Channels />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="*" element={<Dashboard />} />
      </Routes>
    </Shell>
  )
}

const root = document.getElementById('root')
if (!root) throw new Error('找不到 #root 挂载点')

createRoot(root).render(
  <StrictMode>
    <StoreProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StoreProvider>
  </StrictMode>,
)
