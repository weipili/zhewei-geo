/* ============================================================
   哲唯科技 · 数据层
   ------------------------------------------------------------
   仓储抽象：当前实现为 localStorage。
   接入真实后端时，只需把 persist/load 换成 fetch 调用，
   上层组件与业务逻辑零改动。
   ============================================================ */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Alert, AuthMethod, ChannelAccount, Client, ContentItem, GeoAudit, MetricPoint } from './types'
import { seedAccounts, seedAlerts, seedClients, seedContents, seedMetrics } from './seed'

const KEY = 'xy.db.v1'
const SCHEMA = 1

interface DB {
  schema: number
  clients: Client[]
  accounts: ChannelAccount[]
  contents: ContentItem[]
  audits: GeoAudit[]
  metrics: MetricPoint[]
  alerts: Alert[]
}

const freshDB = (): DB => ({
  schema: SCHEMA,
  clients: seedClients,
  accounts: seedAccounts,
  contents: seedContents,
  audits: [],
  metrics: seedMetrics,
  alerts: seedAlerts,
})

function load(): DB {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return freshDB()
    const parsed = JSON.parse(raw) as DB
    if (parsed.schema !== SCHEMA) return freshDB()
    return { ...freshDB(), ...parsed }
  } catch {
    return freshDB()
  }
}

function persist(db: DB) {
  try {
    localStorage.setItem(KEY, JSON.stringify(db))
  } catch (e) {
    console.warn('[哲唯科技] 本地持久化失败', e)
  }
}

/* ---------- Context ---------- */
interface StoreAPI extends DB {
  activeClientId: string
  setActiveClientId: (id: string) => void
  activeClient: Client

  upsertClient: (c: Client) => void
  removeClient: (id: string) => void

  toggleAccount: (clientId: string, code: string) => void

  connectAccount: (
    clientId: string,
    code: string,
    cfg: {
      authMethod: AuthMethod
      credential?: string
      accountName?: string
      expiresAt?: string
      scopes?: string[]
      connectedAt?: string
    },
  ) => void
  disconnectAccount: (clientId: string, code: string) => void
  refreshAccount: (clientId: string, code: string) => void

  upsertContent: (c: ContentItem) => void
  removeContent: (id: string) => void

  upsertAudit: (a: GeoAudit) => void
  removeAudit: (id: string) => void


  markAlertRead: (id: string) => void
  markAllAlertsRead: () => void

  resetAll: () => void
}

const Ctx = createContext<StoreAPI | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<DB>(load)
  const [activeClientId, setActiveClientId] = useState<string>(() => {
    return localStorage.getItem('xy.activeClient') || load().clients[0]?.id || 'c_001'
  })

  useEffect(() => persist(db), [db])
  useEffect(() => localStorage.setItem('xy.activeClient', activeClientId), [activeClientId])

  const patch = useCallback((fn: (d: DB) => DB) => setDb((prev) => fn({ ...prev })), [])

  const api = useMemo<StoreAPI>(() => {
    const activeClient = db.clients.find((c) => c.id === activeClientId) ?? db.clients[0]
    return {
      ...db,
      activeClientId,
      setActiveClientId,
      activeClient,

      upsertClient: (c) =>
        patch((d) => {
          const i = d.clients.findIndex((x) => x.id === c.id)
          d.clients = i >= 0 ? d.clients.map((x) => (x.id === c.id ? c : x)) : [c, ...d.clients]
          return d
        }),

      removeClient: (id) =>
        patch((d) => {
          d.clients = d.clients.filter((x) => x.id !== id)
          d.contents = d.contents.filter((x) => x.clientId !== id)
          d.audits = d.audits.filter((x) => x.clientId !== id)
          d.accounts = d.accounts.filter((x) => x.clientId !== id)
          return d
        }),

      toggleAccount: (clientId, code) =>
        patch((d) => {
          d.accounts = d.accounts.map((a) => {
            if (a.clientId !== clientId || a.code !== code) return a
            const next = !a.connected
            return {
              ...a,
              connected: next,
              health: next ? 'ok' : 'off',
              accountName: next ? a.accountName ?? '已授权账号' : undefined,
              connectedAt: next ? new Date().toISOString() : undefined,
            }
          })
          return d
        }),

      connectAccount: (clientId, code, cfg) =>
        patch((d) => {
          const i = d.accounts.findIndex((a) => a.clientId === clientId && a.code === code)
          const base = {
            code,
            clientId,
            connected: true,
            health: 'ok' as const,
            lastSync: new Date().toISOString(),
            ...cfg,
          }
          if (i < 0) d.accounts = [...d.accounts, base]
          else d.accounts[i] = { ...d.accounts[i], ...base }
          return d
        }),

      disconnectAccount: (clientId, code) =>
        patch((d) => {
          d.accounts = d.accounts.map((a) =>
            a.clientId === clientId && a.code === code
              ? {
                  ...a,
                  connected: false,
                  health: 'off',
                  credential: undefined,
                  authMethod: undefined,
                  scopes: undefined,
                  accountName: undefined,
                  expiresAt: undefined,
                  lastSync: undefined,
                  connectStep: 'idle',
                  error: undefined,
                }
              : a,
          )
          return d
        }),

      refreshAccount: (clientId, code) =>
        patch((d) => {
          d.accounts = d.accounts.map((a) =>
            a.clientId === clientId && a.code === code
              ? {
                  ...a,
                  health: 'ok',
                  lastSync: new Date().toISOString(),
                  expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 60).toISOString(),
                }
              : a,
          )
          return d
        }),

      upsertContent: (c) =>
        patch((d) => {
          const i = d.contents.findIndex((x) => x.id === c.id)
          d.contents = i >= 0 ? d.contents.map((x) => (x.id === c.id ? c : x)) : [c, ...d.contents]
          return d
        }),

      removeContent: (id) => patch((d) => ({ ...d, contents: d.contents.filter((x) => x.id !== id) })),

      upsertAudit: (a) =>
        patch((d) => {
          const i = d.audits.findIndex((x) => x.id === a.id)
          d.audits = i >= 0 ? d.audits.map((x) => (x.id === a.id ? a : x)) : [a, ...d.audits]
          return d
        }),

      removeAudit: (id) => patch((d) => ({ ...d, audits: d.audits.filter((x) => x.id !== id) })),

      markAlertRead: (id) =>
        patch((d) => ({ ...d, alerts: d.alerts.map((a) => (a.id === id ? { ...a, read: true } : a)) })),

      markAllAlertsRead: () => patch((d) => ({ ...d, alerts: d.alerts.map((a) => ({ ...a, read: true })) })),

      resetAll: () => {
        localStorage.removeItem(KEY)
        setDb(freshDB())
      },
    }
  }, [db, activeClientId, patch])

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>
}

export function useStore() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useStore 必须在 StoreProvider 内使用')
  return v
}

/* ---------- 主题 ---------- */
export type ThemeMode = 'light' | 'dark' | 'system'

export function useTheme() {
  const [mode, setMode] = useState<ThemeMode>(() => (localStorage.getItem('xy.theme') as ThemeMode) || 'system')

  useEffect(() => {
    const apply = () => {
      const resolved = mode === 'system' ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : mode
      document.documentElement.dataset.theme = resolved
    }
    apply()
    localStorage.setItem('xy.theme', mode)
    if (mode !== 'system') return
    const mq = matchMedia('(prefers-color-scheme: dark)')
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [mode])

  return { mode, setMode }
}

/* ---------- 工具 ---------- */
export const newId = (prefix: string) => `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

export const fmtNum = (n: number) => {
  if (n >= 100000000) return (n / 100000000).toFixed(2) + '亿'
  if (n >= 10000) return (n / 10000).toFixed(1) + '万'
  return n.toLocaleString('zh-CN')
}

export const fmtDate = (iso?: string) => {
  if (!iso) return '—'
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export const fmtDateTime = (iso?: string) => {
  if (!iso) return '—'
  const d = new Date(iso)
  return `${fmtDate(iso)} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export const relTime = (iso?: string) => {
  if (!iso) return '—'
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return '刚刚'
  if (m < 60) return `${m} 分钟前`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} 小时前`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d} 天前`
  return fmtDate(iso)
}
