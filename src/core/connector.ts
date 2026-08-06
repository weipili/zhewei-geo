/* ============================================================
   哲唯科技~GEO交付平台 · 平台连接器抽象
   ------------------------------------------------------------
   - 后端在线：走真实绑定接口（OAuth 跳转 / API Key / Cookie）
   - 后端离线：回退 mock 模拟授权（沙箱演示）
   ============================================================ */

import type { AuthMethod, ChannelAccount } from './types'
import { api, isBackendUp } from './api'

export interface ConnectResult {
  ok: boolean
  accountName?: string
  expiresAt?: string
  scopes?: string[]
  error?: string
  connectedAt?: string
}

export interface PlatformConnector {
  /** 发起授权：OAuth 返回跳转地址；apikey/cookie 直接校验凭证 */
  authorize(code: string, method: AuthMethod, credential?: string): Promise<{ authUrl?: string; ok: boolean; error?: string }>
  /** 完成连接 */
  connect(code: string, method: AuthMethod, credential?: string): Promise<ConnectResult>
  /** 刷新凭证 / 重新校验 */
  refresh(code: string, acc: ChannelAccount): Promise<ConnectResult>
}

/** 演示用 mock：模拟授权流程，不做真实网络请求 */
export const mockConnector: PlatformConnector = {
  async authorize(_code, method) {
    await new Promise((r) => setTimeout(r, 200))
    if (method === 'oauth') return { authUrl: '#oauth-mock-redirect', ok: true }
    return { ok: true }
  },
  async connect(_code, method, credential) {
    await new Promise((r) => setTimeout(r, 420))
    if (method !== 'oauth' && !credential?.trim()) return { ok: false, error: '凭证不能为空' }
    const exp = new Date(Date.now() + 1000 * 60 * 60 * 24 * 60).toISOString()
    return {
      ok: true,
      accountName: method === 'oauth' ? '已授权账号' : `密钥账号·${(credential || '').slice(0, 4)}…`,
      expiresAt: exp,
      scopes: method === 'oauth' ? ['content:write', 'analytics:read'] : ['content:write'],
      connectedAt: new Date().toISOString(),
    }
  },
  async refresh() {
    await new Promise((r) => setTimeout(r, 300))
    return { ok: true, expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 60).toISOString() }
  },
}

/** 后端优先：后端在线走真实绑定接口，离线回退 mock */
export function getConnector(clientId: string): PlatformConnector {
  return {
    async authorize(code, method, credential) {
      if (await isBackendUp()) {
        const r = await api.connect(clientId, code, method, credential)
        if (r) return { ok: !!r.ok, authUrl: r.authUrl, error: r.error }
      }
      return mockConnector.authorize(code, method, credential)
    },
    async connect(code, method, credential) {
      if (await isBackendUp()) {
        const r = await api.connect(clientId, code, method, credential)
        if (r) {
          return {
            ok: !!r.ok,
            accountName: r.accountName,
            expiresAt: r.expiresAt,
            scopes: r.scopes,
            connectedAt: r.connectedAt,
            error: r.error,
          }
        }
      }
      return mockConnector.connect(code, method, credential)
    },
    async refresh(code, acc) {
      if (await isBackendUp()) {
        const r = await api.refresh(clientId, code)
        if (r) return { ok: true }
      }
      return mockConnector.refresh(code, acc)
    },
  }
}
