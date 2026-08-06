/* ============================================================
   哲唯科技~GEO交付平台 · 应用入口
   - /      官网落地页（公开）
   - /app/* 工作台（登录后使用）
   ============================================================ */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

import { StoreProvider } from './core/store'
import { Shell } from './ui/Shell'

import Landing from './pages/Landing'
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
    <Routes>
      {/* 官网落地页 */}
      <Route path="/" element={<Landing />} />

      {/* 工作台 */}
      <Route path="/app" element={<Shell><Dashboard /></Shell>} />
      <Route path="/app/audit" element={<Shell><Audit /></Shell>} />
      <Route path="/app/reports" element={<Shell><Reports /></Shell>} />
      <Route path="/app/reports/:id" element={<Shell><ReportDetail /></Shell>} />
      <Route path="/app/compose" element={<Shell><Compose /></Shell>} />
      <Route path="/app/queue" element={<Shell><Queue /></Shell>} />
      <Route path="/app/channels" element={<Shell><Channels /></Shell>} />
      <Route path="/app/clients" element={<Shell><Clients /></Shell>} />

      <Route path="*" element={<Landing />} />
    </Routes>
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
