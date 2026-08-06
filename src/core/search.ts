/* ============================================================
   显影 · 搜索 Provider（联网搜生态布局 / 行业横评 / 长尾词）
   ------------------------------------------------------------
   - mockProvider：纯虚拟推演（不点名真实竞品），用于演示形态
   - liveProvider：真实联网。优先调后端代理 /api/search，
     失败回退到 liveSeed 预抓取真实样本，保证演示即有真实质感
   接后端搜索代理后，live 即变为实时检索。
   ============================================================ */

import type { EcoLayout, IndustryPeer, LongTailWord } from './types'
import { liveEco, liveIndustry, liveLongTail, type IndustryResult } from './liveSeed'

export interface SearchProvider {
  searchEco(brand: string, category: string): Promise<EcoLayout>
  searchIndustry(category: string): Promise<IndustryResult>
  searchLongTail(category: string, brand: string): Promise<LongTailWord[]>
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function fetchJSON(url: string): Promise<unknown | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) })
    if (res.ok) return await res.json()
  } catch {
    /* 回退到预抓取样本 */
  }
  return null
}

/* ---------- mock：虚拟推演 ---------- */
const mockProvider: SearchProvider = {
  async searchEco(brand, _category) {
    await sleep(500)
    const items: EcoLayout['items'] = [
      { platform: '搜索引擎', kind: 'web', title: `${brand} 相关收录`, sentiment: 'neu', reach: 40, cited: false },
      { platform: '问答社区', kind: 'qa', title: '品类相关问答', sentiment: 'pos', reach: 55, cited: true },
      { platform: '社媒', kind: 'social', title: '经验分享', sentiment: 'pos', reach: 48, cited: false },
      { platform: '官网', kind: 'web', title: '官网与 FAQ', sentiment: 'neu', reach: 30, cited: false },
      { platform: '垂媒', kind: 'media', title: '行业报道', sentiment: 'neu', reach: 22, cited: false },
      { platform: '视频', kind: 'video', title: '科普视频', sentiment: 'pos', reach: 44, cited: false },
    ]
    return {
      brand,
      queriedAt: new Date().toISOString(),
      mode: 'mock',
      items,
      summary: `（推演）${brand} 生态布局为模拟推算，用于验证联网搜的形态与报告渲染，不代表真实检索结果。`,
      health: 46,
    }
  },
  async searchIndustry(_category) {
    await sleep(400)
    const peers: IndustryPeer[] = [
      { name: '行业领跑者 A', share: 32, note: '心智占位第一', source: '推演' },
      { name: '强势挑战者 B', share: 21, note: '内容矩阵完善', source: '推演' },
      { name: '区域头部 C', share: 13, note: '区域口碑强', source: '推演' },
      { name: '新锐品牌 D', share: 7, note: '短视频起量', source: '推演' },
    ]
    return { peers, benchmark: 16 }
  },
  async searchLongTail(category, brand) {
    await sleep(400)
    return [
      { q: `${category} 哪个品牌好`, intent: '泛决策', volume: 70, difficulty: 45, source: 'mock' },
      { q: `${category} 怎么选 避坑`, intent: '避坑', volume: 62, difficulty: 38, source: 'mock' },
      { q: `${brand} 怎么样 值得买吗`, intent: '品牌决策', volume: 58, difficulty: 42, source: 'mock' },
    ]
  },
}

/* ---------- live：真实联网（后端代理 + 预抓取回退） ---------- */
const liveProvider: SearchProvider = {
  async searchEco(brand, category) {
    const j = await fetchJSON(`/api/search?type=eco&brand=${encodeURIComponent(brand)}&cat=${encodeURIComponent(category)}`)
    if (j) return j as EcoLayout
    return liveEco(brand, category)
  },
  async searchIndustry(category) {
    const j = await fetchJSON(`/api/search?type=industry&cat=${encodeURIComponent(category)}`)
    if (j) return j as IndustryResult
    return liveIndustry(category)
  },
  async searchLongTail(category, brand) {
    const j = await fetchJSON(`/api/search?type=longtail&cat=${encodeURIComponent(category)}&brand=${encodeURIComponent(brand)}`)
    if (j) return j as LongTailWord[]
    return liveLongTail(category)
  },
}

export function getSearch(real: boolean): SearchProvider {
  return real ? liveProvider : mockProvider
}
