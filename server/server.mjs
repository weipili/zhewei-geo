// ============================================================
// 哲唯科技~GEO交付平台 · 后端主服务
// 零依赖 Node 18+（原生 http + fetch）
// 启动：node server/server.mjs
// 端口：主 API 8787（可配 PORT），另绑定 10 个分发服务端口（BIND_PORTS）
// ============================================================
import http from 'node:http'
import { config } from './config.mjs'
import { runAudit } from './geo.mjs'
import { generateContent } from './ai.mjs'
import { fetchCompany, eco, industry, longTail } from './crawler.mjs'
import { hasLLM } from './llm.mjs'
import {
  connectPlatform, oauthCallback, disconnect, refresh, status, publish, portsReport,
} from './channels.mjs'

const NAME = 'zhewei-geo-backend'

/* ---------- 工具 ---------- */
function json(res, code, obj) {
  const body = JSON.stringify(obj)
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Cache-Control': 'no-store',
  })
  res.end(body)
}

function readBody(req) {
  return new Promise((resolve) => {
    let data = ''
    req.on('data', (c) => { data += c; if (data.length > 2_000_000) req.destroy() })
    req.on('end', () => {
      if (!data) return resolve({})
      try { resolve(JSON.parse(data)) } catch { resolve({}) }
    })
    req.on('error', () => resolve({}))
  })
}

function parseUrl(u) {
  try { return new URL(u, 'http://localhost') } catch { return new URL('/', 'http://localhost') }
}

/* ---------- 路由 ---------- */
async function route(req, res, pathname, query, body) {
  if (req.method === 'GET' && pathname === '/api/health') {
    return json(res, 200, {
      ok: true, name: NAME, time: new Date().toISOString(),
      services: { crawler: true, llm: hasLLM() },
      apiPort: config.port,
      bindPorts: config.bindPorts,
      sandbox: config.sandbox,
    })
  }
  if (req.method === 'GET' && pathname === '/api/ports') {
    return json(res, 200, {
      ok: true,
      apiPort: config.port,
      bindPorts: config.bindPorts.map((p, i) => ({ port: p, service: (portsReport()[i]?.service) || `worker-${i}`, bound: true })),
      platforms: portsReport(),
    })
  }

  if (req.method === 'GET' && pathname === '/api/company/info') {
    return json(res, 200, await fetchCompany(query.get('website') || ''))
  }

  if (req.method === 'GET' && pathname === '/api/search') {
    const type = query.get('type') || 'eco'
    const brand = query.get('brand') || ''
    const cat = query.get('cat') || ''
    if (type === 'industry') return json(res, 200, await industry(cat))
    if (type === 'longtail') return json(res, 200, await longTail(cat, brand))
    return json(res, 200, await eco(brand, cat))
  }

  if (req.method === 'POST' && pathname === '/api/geo/audit') {
    return json(res, 200, { ok: true, result: await runAudit(body) })
  }

  if (req.method === 'GET' && pathname === '/api/channels') {
    return json(res, 200, { ok: true, platforms: status(query.get('clientId') || '') })
  }

  let m = pathname.match(/^\/api\/channels\/oauth\/([a-z]+)\/callback$/)
  if (m && req.method === 'GET') {
    const r = await oauthCallback(query.get('clientId') || '', m[1], Object.fromEntries(query))
    return json(res, r.ok ? 200 : 400, r)
  }
  m = pathname.match(/^\/api\/channels\/([a-z]+)\/connect$/)
  if (m && req.method === 'POST') {
    const r = connectPlatform(body.clientId || '', m[1], body.method || 'oauth', body.credential)
    return json(res, r.ok ? 200 : 400, r)
  }
  m = pathname.match(/^\/api\/channels\/([a-z]+)\/disconnect$/)
  if (m && req.method === 'POST') {
    return json(res, 200, disconnect(body.clientId || '', m[1]))
  }
  m = pathname.match(/^\/api\/channels\/([a-z]+)\/refresh$/)
  if (m && req.method === 'POST') {
    const r = refresh(body.clientId || '', m[1])
    return json(res, r.ok ? 200 : 400, r)
  }

  if (req.method === 'POST' && pathname === '/api/publish') {
    const results = await publish(body.clientId || '', body.content || {}, Array.isArray(body.channels) ? body.channels : [])
    return json(res, 200, { ok: true, results, sandbox: config.sandbox })
  }

  if (req.method === 'POST' && pathname === '/api/ai/generate') {
    return json(res, 200, { ok: true, ...(await generateContent(body)) })
  }

  json(res, 404, { ok: false, error: 'not-found', path: pathname })
}

/* ---------- 主服务 ---------- */
const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    })
    return res.end()
  }
  const url = parseUrl(req.url)
  try {
    const body = (req.method === 'POST' || req.method === 'PUT') ? await readBody(req) : {}
    await route(req, res, url.pathname, url.searchParams, body)
  } catch (e) {
    json(res, 500, { ok: false, error: String((e && e.message) || e) })
  }
})

server.listen(config.port, config.host, () => {
  console.log(`[${NAME}] API 已启动: http://${config.host}:${config.port}`)
  console.log(`[${NAME}] 沙箱模式: ${config.sandbox} | 大模型: ${hasLLM() ? '已配置' : '未配置(LLM_API_KEY)'}`)
})

/* ---------- 分发平台服务端口绑定 ---------- */
for (const port of config.bindPorts) {
  const s = http.createServer((req, res) => {
    const url = parseUrl(req.url)
    const data = JSON.stringify({ ok: true, service: 'zhewei-分发服务', port, path: url.pathname, time: new Date().toISOString() })
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' })
    res.end(data)
  })
  s.on('error', (e) => console.warn(`[${NAME}] 端口 ${port} 绑定失败: ${e.message}`))
  s.listen(port, config.host, () => {
    console.log(`[${NAME}] 分发服务端口已绑定: ${config.host}:${port}`)
  })
}
