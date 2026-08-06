// ============================================================
// 哲唯科技~GEO交付平台 · 后端配置
// 全部通过环境变量注入，可用 .env 或系统环境变量覆盖
// ============================================================
// 简易 .env 加载（server/.env，若存在）
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
try {
  const __dirname = path.dirname(fileURLToPath(import.meta.url))
  const envFile = path.join(__dirname, '.env')
  if (fs.existsSync(envFile)) {
    for (const line of fs.readFileSync(envFile, 'utf-8').split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/)
      if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
  }
} catch { /* 忽略 .env 读取错误 */ }

const env = process.env || {}

export const config = {
  // 服务监听
  host: env.HOST || '0.0.0.0',
  port: Number(env.PORT || 8787),
  // 沙箱模式：为 true 时“发布”为模拟成功，不真正调用平台 API；接入凭证后置为 false
  sandbox: env.SANDBOX_MODE !== 'false',

  // 大模型（AI 生成 / GEO 实测问答）——OpenAI 兼容接口
  llm: {
    apiKey: env.LLM_API_KEY || env.OPENAI_API_KEY || '',
    baseUrl: env.LLM_BASE_URL || 'https://api.openai.com/v1',
    model: env.LLM_MODEL || 'gpt-4o-mini',
  },

  // 各分发平台开发者凭证（真实投产时填入；留空则走沙箱/模拟授权）
  platforms: {
    wechat:     { appId: env.WECHAT_APP_ID || '', appSecret: env.WECHAT_APP_SECRET || '' },
    zhihu:      { clientId: env.ZHIHU_CLIENT_ID || '', clientSecret: env.ZHIHU_CLIENT_SECRET || '' },
    baijia:     { token: env.BAIJIA_TOKEN || '' },
    xiaohongshu:{ clientId: env.XIAOHONGSHU_CLIENT_ID || '', clientSecret: env.XIAOHONGSHU_CLIENT_SECRET || '' },
    toutiao:    { clientId: env.TOUTIAO_CLIENT_ID || '', clientSecret: env.TOUTIAO_CLIENT_SECRET || '' },
    weibo:      { appKey: env.WEIBO_APP_KEY || '', appSecret: env.WEIBO_APP_SECRET || '' },
    csdn:       { username: env.CSDN_USERNAME || '', password: env.CSDN_PASSWORD || '' },
    douyin:     { clientKey: env.DOUYIN_CLIENT_KEY || '', clientSecret: env.DOUYIN_CLIENT_SECRET || '' },
    shipinhao:  { appId: env.SHIPINHAO_APP_ID || '', appSecret: env.SHIPINHAO_APP_SECRET || '' },
    bilibili:   { clientId: env.BILIBILI_CLIENT_ID || '', clientSecret: env.BILIBILI_CLIENT_SECRET || '' },
  },

  // OAuth 回调地址（真实授权时需要公网可达）
  oauthRedirect: env.OAUTH_REDIRECT || 'http://localhost:8787/api/channels/oauth/callback',

  // 额外绑定的“分发服务端口”：对应你关心的各平台服务端口
  // 每个端口都会起一个健康检查监听，证明端口已绑定
  bindPorts: (env.BIND_PORTS || '9091,9092,9093,9094,9095,9096,9097,9098,9099,9100')
    .split(',').map((s) => Number(s.trim())).filter((n) => Number.isFinite(n) && n > 0),
}

export function platformCreds(code) {
  return config.platforms[code] || {}
}

export function hasPlatformCreds(code) {
  const c = platformCreds(code)
  return Object.values(c).some((v) => !!v)
}
