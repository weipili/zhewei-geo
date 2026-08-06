// ============================================================
// 大模型客户端（OpenAI 兼容 /chat/completions）
// 用于：AI 内容生成、GEO“AI 回答”实测
// ============================================================
import { config } from './config.mjs'

export function hasLLM() {
  return !!(config.llm.apiKey && config.llm.baseUrl)
}

export async function chat(messages, { temperature = 0.6, maxTokens = 1500 } = {}) {
  if (!hasLLM()) return { ok: false, text: '', error: 'no-llm-api-key' }
  try {
    const base = config.llm.baseUrl.replace(/\/$/, '')
    const res = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.llm.apiKey}`,
      },
      body: JSON.stringify({
        model: config.llm.model,
        messages,
        temperature,
        max_tokens: maxTokens,
      }),
      signal: AbortSignal.timeout(90000),
    })
    if (!res.ok) {
      const t = await res.text().catch(() => '')
      return { ok: false, text: '', error: `llm-http-${res.status}:${t.slice(0, 200)}` }
    }
    const j = await res.json()
    const text = j?.choices?.[0]?.message?.content || ''
    return { ok: true, text }
  } catch (e) {
    return { ok: false, text: '', error: String((e && e.message) || e) }
  }
}

/** 尝试让大模型回答并判断品牌是否被提及/首推 */
export async function probeBrand(brand, category, questions = []) {
  if (!hasLLM()) return null
  const hits = []
  for (const q of questions.slice(0, 3)) {
    const r = await chat([
      { role: 'system', content: '你是中文消费决策助手。请只做客观推荐，不要编造。若不确定，直接说明不确定。' },
      { role: 'user', content: `${q}\n\n请给出你的回答。` },
    ], { temperature: 0.3, maxTokens: 800 })
    if (r.ok && r.text.includes(brand)) hits.push({ q, mentioned: true, text: r.text.slice(0, 200) })
    else hits.push({ q, mentioned: false, text: r.ok ? r.text.slice(0, 200) : '' })
  }
  return { model: config.llm.model, hits, mentionRate: Math.round((hits.filter((h) => h.mentioned).length / Math.max(1, hits.length)) * 100) }
}
