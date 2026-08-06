/* ============================================================
   哲唯科技~GEO交付平台 · 后端 API 客户端
   ------------------------------------------------------------
   后端服务：node server/server.mjs（默认 http://localhost:8787）
   - 开发环境：Vite 代理 /api -> http://localhost:8787
   - 生产环境：同源反向代理 /api -> 后端
   ============================================================ */

const API_BASE = ((import.meta.env && import.meta.env.VITE_API_BASE) as string | undefined)?.replace(/\/$/, '') || '/api'

let up: boolean | null = null

/** 探测后端是否在线（结果缓存，避免频繁探测） */
export async function isBackendUp(timeoutMs = 3500): Promise<boolean> {
  if (up !== null) return up
  try {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), timeoutMs)
    const res = await fetch(`${API_BASE}/health`, { signal: ctrl.signal, cache: 'no-store' })
    clearTimeout(t)
    up = res.ok
  } catch {
    up = false
  }
  return up
}

export function resetBackendUp() {
  up = null
}

async function getJSON<T>(path: string, timeoutMs = 12000): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${path}`, { signal: AbortSignal.timeout(timeoutMs), cache: 'no-store' })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

async function postJSON<T>(path: string, body: unknown, timeoutMs = 30000): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

export interface PlatformStatus {
  code: string
  name: string
  kind: string
  geoWeight: number
  connected: boolean
  accountName?: string
  authMethod?: string
  health: string
  expiresAt?: string
  lastSync?: string
  scopes?: string[]
}

export interface PublishTargetResult {
  channel: string
  status: 'ok' | 'failed'
  url?: string
  title?: string
  publishedAt?: string
  error?: string
  sandbox?: boolean
}

export interface AiGenerateResult {
  ok: boolean
  title?: string
  summary?: string
  body?: string
  tags?: string[]
  qaPairs?: { q: string; a: string }[]
  geoScore?: number
  source?: string
  note?: string
  platformTip?: string
}

export const api = {
  health: () => getJSON<{ ok: boolean; sandbox: boolean; bindPorts: number[] }>('/health', 4000),
  ports: () => getJSON<{ ok: boolean; bindPorts: { port: number; service: string; bound: boolean }[] }>('/ports', 4000),

  channels: (clientId: string) =>
    getJSON<{ ok: boolean; platforms: PlatformStatus[] }>(`/channels?clientId=${encodeURIComponent(clientId)}`, 6000),

  connect: (clientId: string, code: string, method: string, credential?: string) =>
    postJSON<{ ok: boolean; authUrl?: string; accountName?: string; expiresAt?: string; scopes?: string[]; connectedAt?: string; error?: string }>(
      `/channels/${code}/connect`,
      { clientId, method, credential },
      12000,
    ),

  oauthCallback: (clientId: string, code: string) =>
    getJSON<{ ok: boolean }>(`/channels/oauth/${code}/callback?clientId=${encodeURIComponent(clientId)}`, 12000),

  disconnect: (clientId: string, code: string) => postJSON<{ ok: boolean }>(`/channels/${code}/disconnect`, { clientId }, 6000),
  refresh: (clientId: string, code: string) => postJSON<{ ok: boolean }>(`/channels/${code}/refresh`, { clientId }, 6000),

  publish: (clientId: string, content: unknown, channels: string[]) =>
    postJSON<{ ok: boolean; results: PublishTargetResult[] }>('/publish', { clientId, content, channels }, 30000),

  aiGenerate: (payload: unknown) => postJSON<AiGenerateResult>('/ai/generate', payload, 60000),

  geoAudit: (payload: unknown) =>
    postJSON<{ ok: boolean; result: unknown }>('/geo/audit', payload, 120000),

  companyInfo: (website: string) =>
    getJSON<{ ok: boolean; title?: string; description?: string; keywords?: string[] }>(`/company/info?website=${encodeURIComponent(website)}`, 12000),
}

/** 快捷判断：是否应优先使用真实数据/真实发布 */
export const preferLive = async () => isBackendUp()
