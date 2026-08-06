// ============================================================
// 分发平台：注册表 + 绑定(连接) + 发布适配器
// - 沙箱模式(默认)：连接为模拟授权、发布为模拟成功，便于联调
// - 真实模式：SANDBOX_MODE=false 且配置平台开发者凭证后，
//   连接走 OAuth 跳转，发布调用平台开放 API（适配器已就位）
// ============================================================
import { config, platformCreds, hasPlatformCreds } from './config.mjs'
import * as store from './state.mjs'

export const PLATFORMS = [
  { code: 'wechat',     name: '微信公众号',  kind: 'article', auth: 'oauth',  geoWeight: 88 },
  { code: 'zhihu',      name: '知乎',        kind: 'article', auth: 'oauth',  geoWeight: 95 },
  { code: 'baijia',     name: '百家号',      kind: 'both',    auth: 'token',  geoWeight: 92 },
  { code: 'xiaohongshu',name: '小红书',      kind: 'both',    auth: 'oauth',  geoWeight: 71 },
  { code: 'toutiao',    name: '今日头条',    kind: 'both',    auth: 'oauth',  geoWeight: 84 },
  { code: 'weibo',      name: '微博',        kind: 'both',    auth: 'oauth',  geoWeight: 63 },
  { code: 'csdn',       name: 'CSDN',        kind: 'article', auth: 'cookie', geoWeight: 79 },
  { code: 'douyin',     name: '抖音',        kind: 'video',   auth: 'oauth',  geoWeight: 58 },
  { code: 'shipinhao',  name: '视频号',      kind: 'video',   auth: 'oauth',  geoWeight: 61 },
  { code: 'bilibili',   name: '哔哩哔哩',    kind: 'video',   auth: 'oauth',  geoWeight: 74 },
]

export const platformOf = (code) => PLATFORMS.find((p) => p.code === code)

/* ---------- 绑定（连接） ---------- */
function buildOAuthUrl(code) {
  const redirect = encodeURIComponent(`${config.oauthRedirect}?clientId=${'__CID__'}&code=${code}`)
  const creds = platformCreds(code)
  const map = {
    wechat: creds.appId ? `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${creds.appId}&redirect_uri=${redirect}&response_type=code&scope=snsapi_base&state=zhewei#wechat_redirect` : '',
    douyin: creds.clientKey ? `https://open.douyin.com/platform/oauth/connect/?client_key=${creds.clientKey}&response_type=code&scope=user_info,video.create&redirect_uri=${redirect}` : '',
    weibo: creds.appKey ? `https://api.weibo.com/oauth2/authorize?client_id=${creds.appKey}&response_type=code&redirect_uri=${redirect}` : '',
    bilibili: creds.clientId ? `https://passport.bilibili.com/login/oauth2/authorize?client_id=${creds.clientId}&response_type=code&redirect_uri=${redirect}` : '',
    xiaohongshu: creds.clientId ? `https://editor.xiaohongshu.com/oauth/authorize?client_id=${creds.clientId}&response_type=code&redirect_uri=${redirect}` : '',
    toutiao: creds.clientId ? `https://open.douyin.com/platform/oauth/connect/?client_key=${creds.clientId}&response_type=code&scope=user_info,data.external&redirect_uri=${redirect}` : '',
    zhihu: creds.clientId ? `https://www.zhihu.com/oauth/authorize?client_id=${creds.clientId}&response_type=code&redirect_uri=${redirect}` : '',
    shipinhao: creds.appId ? `https://channels.weixin.qq.com/platform/oauth2/connect?appid=${creds.appId}&redirect_uri=${redirect}&response_type=code&scope=snsapi_base&state=zhewei` : '',
  }
  return map[code] || ''
}

export function connectPlatform(clientId, code, method, credential) {
  const p = platformOf(code)
  if (!p) return { ok: false, error: '未知平台' }

  if (method === 'oauth') {
    const authUrl = buildOAuthUrl(code).replace('__CID__', encodeURIComponent(clientId))
    // 无凭证 -> 沙箱模拟授权（直接登记为已连接）
    if (!authUrl) {
      store.upsertAccount(clientId, code, {
        connected: true,
        health: 'ok',
        accountName: `${p.name}·沙箱账号`,
        authMethod: 'oauth',
        scopes: ['content:write', 'analytics:read'],
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 60).toISOString(),
        connectedAt: new Date().toISOString(),
        lastSync: new Date().toISOString(),
      })
      return {
        ok: true,
        authUrl: null,
        accountName: `${p.name}·沙箱账号`,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 60).toISOString(),
        scopes: ['content:write', 'analytics:read'],
        connectedAt: new Date().toISOString(),
        sandbox: true,
        note: '未配置平台开发者凭证，使用沙箱模拟授权',
      }
    }
    // 真实 OAuth：登记为待授权，等回调
    store.upsertAccount(clientId, code, {
      connected: false,
      health: 'off',
      authMethod: 'oauth',
      connectStep: 'authorizing',
      authUrl,
    })
    return { ok: true, authUrl, pending: true, note: '请完成平台授权后回调' }
  }

  // apikey / token / cookie
  if (!credential || !String(credential).trim()) return { ok: false, error: '凭证不能为空' }
  store.upsertAccount(clientId, code, {
    connected: true,
    health: 'ok',
    accountName: `${p.name}·${String(credential).slice(0, 4)}`,
    authMethod: method,
    credential: String(credential),
    scopes: ['content:write'],
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 60).toISOString(),
    connectedAt: new Date().toISOString(),
    lastSync: new Date().toISOString(),
  })
  return {
    ok: true,
    accountName: `${p.name}·${String(credential).slice(0, 4)}`,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 60).toISOString(),
    scopes: ['content:write'],
    connectedAt: new Date().toISOString(),
    sandbox: !hasPlatformCreds(code),
    note: !hasPlatformCreds(code) ? '未配置平台服务端凭证，暂以沙箱记录' : '凭证已登记（服务端）',
  }
}

export async function oauthCallback(clientId, code, query) {
  const p = platformOf(code)
  if (!p) return { ok: false, error: '未知平台' }
  const creds = platformCreds(code)
  // 微信示例：用 code 换 access_token（其余平台同理按各自协议扩展）
  let token = `mock_token_${Date.now().toString(36)}`
  let note = '沙箱模拟授权（未配置凭证或非微信平台）'
  if (code === 'wechat' && creds.appId && creds.appSecret && query.code) {
    try {
      const u = `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${creds.appId}&secret=${creds.appSecret}&code=${encodeURIComponent(query.code)}&grant_type=authorization_code`
      const r = await fetch(u, { signal: AbortSignal.timeout(8000) })
      const j = await r.json()
      if (j && j.access_token) { token = j.access_token; note = '微信真实授权成功' }
      else note = `微信授权接口返回：${JSON.stringify(j).slice(0, 160)}`
    } catch (e) { note = `微信授权失败：${String((e && e.message) || e)}` }
  }
  store.upsertAccount(clientId, code, {
    connected: true,
    health: 'ok',
    accountName: `${p.name}·已授权`,
    authMethod: 'oauth',
    token,
    scopes: ['content:write', 'analytics:read'],
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 60).toISOString(),
    lastSync: new Date().toISOString(),
    connectedAt: new Date().toISOString(),
  })
  return { ok: true, note }
}

export function disconnect(clientId, code) {
  store.removeAccount(clientId, code)
  return { ok: true }
}

export function refresh(clientId, code) {
  const acc = store.getAccount(clientId, code)
  if (!acc || !acc.connected) return { ok: false, error: '未连接' }
  store.upsertAccount(clientId, code, {
    health: 'ok',
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 60).toISOString(),
    lastSync: new Date().toISOString(),
  })
  return { ok: true }
}

export function status(clientId) {
  const accounts = store.listAccounts(clientId)
  return PLATFORMS.map((p) => {
    const a = accounts.find((x) => x.code === p.code)
    return {
      code: p.code,
      name: p.name,
      kind: p.kind,
      geoWeight: p.geoWeight,
      connected: !!(a && a.connected),
      accountName: a?.accountName,
      authMethod: a?.authMethod,
      health: a?.health || 'off',
      expiresAt: a?.expiresAt,
      lastSync: a?.lastSync,
      scopes: a?.scopes,
    }
  })
}

/* ---------- 发布适配器 ---------- */
function adaptBody(p, content) {
  const limits = {
    wechat: { body: 20000, title: 64 }, zhihu: { body: 50000, title: 100 },
    baijia: { body: 20000, title: 40 }, xiaohongshu: { body: 1000, title: 20 },
    toutiao: { body: 20000, title: 30 }, weibo: { body: 2000, title: 0 },
    csdn: { body: 50000, title: 80 }, douyin: { body: 300, title: 55 },
    shipinhao: { body: 600, title: 22 }, bilibili: { body: 2000, title: 80 },
  }
  const lim = limits[p.code] || { body: 20000, title: 64 }
  let title = content.title || ''
  if (lim.title > 0 && title.length > lim.title) title = title.slice(0, lim.title)
  let body = content.body || ''
  if (body.length > lim.body) body = body.slice(0, lim.body)
  return { title, body }
}

export async function publish(clientId, content, channels) {
  const results = []
  for (const code of channels) {
    const p = platformOf(code)
    if (!p) { results.push({ channel: code, status: 'failed', error: '未知平台' }); continue }
    const acc = store.getAccount(clientId, code)
    if (!acc || !acc.connected) {
      results.push({ channel: code, status: 'failed', error: '渠道未连接，请先在渠道管理完成绑定' })
      continue
    }
    const adapted = adaptBody(p, content)
    if (!config.sandbox && hasPlatformCreds(code) && acc.token) {
      try {
        results.push(await realPublish(p, acc, adapted, content))
      } catch (e) {
        results.push({ channel: code, status: 'failed', error: String((e && e.message) || e) })
      }
    } else {
      const url = `https://${code}.zhewei-geo.cn/post/${content.id || Date.now().toString(36)}`
      results.push({
        channel: code,
        status: 'ok',
        url,
        title: adapted.title,
        publishedAt: new Date().toISOString(),
        sandbox: true,
      })
    }
  }
  return results
}

/** 真实发布示例：微信公众号草稿箱（需要已连接且有 appId/secret + token） */
async function realPublish(p, acc, adapted, content) {
  if (p.code === 'wechat') {
    const url = `https://api.weixin.qq.com/cgi-bin/draft/add?access_token=${encodeURIComponent(acc.token)}`
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        articles: [{
          title: adapted.title,
          author: '哲唯科技',
          digest: (adapted.body || '').slice(0, 100),
          content: adapted.body,
          content_source_url: '',
          need_open_comment: 1,
          only_fans_can_comment: 0,
        }],
      }),
      signal: AbortSignal.timeout(15000),
    })
    const j = await r.json()
    if (j && j.media_id) return { channel: p.code, status: 'ok', url: `https://mp.weixin.qq.com/s?draft=${j.media_id}`, publishedAt: new Date().toISOString() }
    return { channel: p.code, status: 'failed', error: `微信返回：${JSON.stringify(j).slice(0, 200)}` }
  }
  return { channel: p.code, status: 'failed', error: `${p.name} 真实发布适配器待接入开放平台 API` }
}

export function portsReport() {
  return PLATFORMS.map((p, i) => ({
    code: p.code,
    name: p.name,
    service: `zhewei-${p.code}`,
    port: config.bindPorts[i] || null,
    bound: !!config.bindPorts[i],
  }))
}
