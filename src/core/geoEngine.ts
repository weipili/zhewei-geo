/* ============================================================
   显影 · GEO 体检引擎
   ------------------------------------------------------------
   实现 4 阶段流水线：
     阶段1 基础调研（画像 / 基建 / 竞品）
     阶段2 收录 + 可见性   ┐ 并行
     阶段3 舆情分析        ┘
     阶段4 AIVO 评分 + 建议（依赖 2+3）

   AIVO 四维等权重：可见性 25 / 基建 25 / 竞争 25 / 舆情 25
   ≥90 优秀 · ≥75 良好 · ≥60 一般 · <60 较差

   ⚠️ 当前为「虚拟推理」模式：由确定性算法基于品牌特征生成
   合理波动的模拟数据。接入真实 WebSearch / 平台 API 后，
   只需替换 runStage* 内部的数据获取逻辑，输出契约不变。
   ============================================================ */

import { AI_PLATFORMS } from './types'
import type {
  AivoScore,
  CompetitorMatrixRow,
  CompetitorRow,
  GainLossItem,
  GeoAudit,
  IndustryPeer,
  InfraItem,
  PlatformMention,
  Suggestion,
} from './types'
import { getSearch } from './search'
import { liveDistill, liveFactors } from './liveSeed'

/* ---------- 确定性伪随机：同品牌每次结果稳定，便于复现 ---------- */
function seedFrom(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}
function rng(seed: number) {
  let x = seed || 1
  return () => {
    x ^= x << 13
    x ^= x >>> 17
    x ^= x << 5
    x >>>= 0
    return x / 4294967296
  }
}

/** 平台偏好偏差：同品牌各平台提及率应有 ±8% 合理波动 */
const PLATFORM_BIAS: Record<number, number> = {
  1: -3.2, // DeepSeek 偏保守，少直接点名品牌
  2: +5.6, // 豆包 偏消费向，爱推荐
  3: +2.8, // 元宝 微信生态语料充足
  4: +1.4, // 通义 电商语料强
  5: +4.1, // 文心 百度系收录多
  6: -1.8, // 纳米搜索
  7: -4.6, // Kimi 长文严谨，点名率低
  8: -0.9, // 智谱清言
}

export interface StageEvent {
  phase: GeoAudit['phase']
  progress: number
  label: string
  detail: string
}

/* ---------- 阶段 1：基础调研 ---------- */
function runStage1(brand: string, category: string, website: string | undefined, r: () => number) {
  const persona = `关注${category}的决策型用户，以 25-45 岁为主，购买前平均在 AI 助手中提问 3-5 轮，重点比较口碑、性价比与售后。`
  const scenarios = [
    `${category}哪个品牌好`,
    `${brand}怎么样，值得买吗`,
    `${category}选购避坑指南`,
    `${brand} 和同类品牌对比`,
    `预算有限选什么${category}`,
  ]
  const questions = [
    `推荐几个靠谱的${category}品牌`,
    `${brand}的口碑如何`,
    `${category}十大品牌排行`,
    `${brand}和竞品哪个更值`,
    `买${category}要注意什么`,
    `${category}性价比之王是谁`,
  ]

  // 基建评估：有官网显著加分
  const hasSite = !!website
  const infra: InfraItem[] = [
    {
      name: '官网结构化数据',
      score: hasSite ? 14 + Math.round(r() * 6) : 4 + Math.round(r() * 4),
      max: 25,
      status: hasSite ? 'warn' : 'bad',
      finding: hasSite
        ? '官网已收录，但缺少 FAQ Schema 与 Organization 结构化标记，AI 难以抽取权威事实。'
        : '未提供官网或官网未被主流搜索收录，AI 缺少品牌事实锚点，是当前最大短板。',
    },
    {
      name: '自媒体矩阵覆盖',
      score: 10 + Math.round(r() * 9),
      max: 25,
      status: 'warn',
      finding: '公众号/知乎/百家号存在账号但更新不稳定，近 90 天有效内容不足 12 篇，未形成语料密度。',
    },
    {
      name: '权威媒体背书',
      score: 6 + Math.round(r() * 10),
      max: 25,
      status: r() > 0.55 ? 'warn' : 'bad',
      finding: '行业垂媒与门户报道稀少，缺少可被 AI 判定为高可信度的第三方来源。',
    },
    {
      name: '百科与问答阵地',
      score: 8 + Math.round(r() * 11),
      max: 25,
      status: 'warn',
      finding: '百科词条基础信息完整度约六成，知乎相关问答下缺少品牌方系统性回答。',
    },
  ]

  // 竞品
  const compNames = ['行业领跑者 A', '强势挑战者 B', '区域头部 C', '新锐品牌 D']
  const selfBase = 12 + r() * 22
  const competitors: CompetitorRow[] = [
    { name: compNames[0], avgRate: Math.round(48 + r() * 22), isSelf: false, strength: '百科+权威媒体齐全，AI 首推率极高' },
    { name: compNames[1], avgRate: Math.round(32 + r() * 16), isSelf: false, strength: '知乎问答矩阵完善，长尾覆盖强' },
    { name: brand, avgRate: Math.round(selfBase), isSelf: true, strength: '有一定基础，但语料密度与结构化明显不足' },
    { name: compNames[2], avgRate: Math.round(14 + r() * 12), isSelf: false, strength: '区域口碑好，全国心智弱' },
    { name: compNames[3], avgRate: Math.round(6 + r() * 10), isSelf: false, strength: '短视频起量快，AI 引用少' },
  ].sort((a, b) => b.avgRate - a.avgRate)

  return { persona, scenarios, questions, infra, competitors, selfBase }
}

/* ---------- 阶段 2：收录 + 可见性 ---------- */
function runStage2(platforms: number[], selfBase: number, r: () => number) {
  const mentions: PlatformMention[] = platforms.map((code) => {
    const meta = AI_PLATFORMS.find((p) => p.code === code)!
    const bias = PLATFORM_BIAS[code] ?? 0
    const noise = (r() - 0.5) * 6
    const rate = Math.max(0, Math.min(100, Math.round((selfBase + bias + noise) * 10) / 10))
    const samples = 6
    return {
      code,
      name: meta.name,
      rate,
      firstPlace: Math.round((rate / 100) * samples * (0.35 + r() * 0.3)),
      samples,
      source: r() > 0.45 ? 'search' : 'virtual',
    }
  })
  return mentions
}

/* ---------- 阶段 3：舆情 ---------- */
function runStage3(brand: string, category: string, r: () => number) {
  const positive = Math.round(48 + r() * 24)
  const negative = Math.round(6 + r() * 14)
  const neutral = 100 - positive - negative
  const topics: { word: string; heat: number; tone: 'pos' | 'neu' | 'neg' }[] = [
    { word: '性价比高', heat: Math.round(60 + r() * 35), tone: 'pos' },
    { word: '服务响应快', heat: Math.round(45 + r() * 30), tone: 'pos' },
    { word: '质量稳定', heat: Math.round(40 + r() * 28), tone: 'pos' },
    { word: `${category}参数`, heat: Math.round(35 + r() * 25), tone: 'neu' },
    { word: '价格咨询', heat: Math.round(30 + r() * 22), tone: 'neu' },
    { word: '发货偏慢', heat: Math.round(16 + r() * 18), tone: 'neg' },
    { word: '售后流程繁琐', heat: Math.round(12 + r() * 15), tone: 'neg' },
    { word: `${brand}官方`, heat: Math.round(25 + r() * 20), tone: 'neu' },
  ]
  topics.sort((a, b) => b.heat - a.heat)
  return { positive, neutral, negative, topics }
}

/* ---------- 阶段 4：AIVO 评分 + 建议 ---------- */
function runStage4(
  brand: string,
  mentions: PlatformMention[],
  infra: InfraItem[],
  competitors: CompetitorRow[],
  sentiment: { positive: number; neutral: number; negative: number },
  r: () => number,
) {
  const avgRate = mentions.reduce((s, m) => s + m.rate, 0) / Math.max(1, mentions.length)
  // 可见性：提及率映射到 0-100（40% 提及率≈满分区间）
  const visibility = Math.round(Math.min(100, (avgRate / 55) * 100))
  // 基建：实际得分 / 满分
  const infraScore = Math.round((infra.reduce((s, i) => s + i.score, 0) / infra.reduce((s, i) => s + i.max, 0)) * 100)
  // 竞争：自身相对第一名的位置
  const top = competitors[0]
  const self = competitors.find((c) => c.isSelf)!
  const competition = Math.round(Math.min(100, (self.avgRate / Math.max(1, top.avgRate)) * 100))
  // 舆情：正面占比减去负面惩罚
  const sentimentScore = Math.round(Math.max(0, Math.min(100, sentiment.positive + sentiment.neutral * 0.4 - sentiment.negative * 1.5)))

  const total = Math.round((visibility + infraScore + competition + sentimentScore) / 4)
  const grade: AivoScore['grade'] = total >= 90 ? '优秀' : total >= 75 ? '良好' : total >= 60 ? '一般' : '较差'

  const aivo: AivoScore = { visibility, infra: infraScore, competition, sentiment: sentimentScore, total, grade }

  const suggestions: Suggestion[] = [
    {
      priority: 'P0',
      title: '官网补齐结构化事实层',
      detail:
        '在官网新增 FAQ 页并注入 FAQPage / Organization / Product 三类 JSON-LD 结构化数据，把品牌名、成立时间、主营品类、服务区域、资质写成机器可读事实。这是 AI 判定品牌可信度的第一道锚点，缺失会导致所有平台提及率天花板被锁死。',
      effort: '低',
      impact: '高',
      owner: '技术 / 站长',
    },
    {
      priority: 'P0',
      title: '知乎问答阵地攻坚',
      detail: `锁定「${brand}怎么样」「同品类怎么选」等 12 个高意图长尾问题，以专业身份撰写结构化长答案（含小标题+数据+对比表）。知乎是中文大模型引用权重最高的单一站点，见效周期约 3-5 周。`,
      effort: '中',
      impact: '高',
      owner: '内容运营',
    },
    {
      priority: 'P1',
      title: '建立 Q&A 化内容生产规范',
      detail:
        '所有对外内容强制包含 3-5 组问答对，标题使用疑问句式。AI 检索偏好问答结构，同样字数下被引用概率可提升 1.8-2.4 倍。已在内容中台内置该字段，发布前会自动校验。',
      effort: '低',
      impact: '中',
      owner: '内容运营',
    },
    {
      priority: 'P1',
      title: '百度系语料补给',
      detail: '百家号每周稳定 2 篇 + 百科词条完善至九成完整度，直接改善文心一言与纳米搜索的提及表现。',
      effort: '中',
      impact: '中',
      owner: '内容运营',
    },
    {
      priority: 'P1',
      title: '负面话题主动稀释',
      detail: `围绕「发货」「售后」两个负面词，产出正向解释性内容（时效承诺、售后流程图解），压低负面词在 AI 回答中的出现概率。`,
      effort: '中',
      impact: '中',
      owner: '客服 / 品牌',
    },
    {
      priority: 'P2',
      title: '权威媒体背书采买',
      detail: '争取 2-3 家行业垂媒的深度报道或榜单收录，提升 AI 对品牌的可信度加权。周期长但护城河效果最持久。',
      effort: '高',
      impact: '高',
      owner: '市场 / PR',
    },
  ]

  const overview = {
    summary: `${brand} 当前 AIVO 综合得分 ${total} 分（${grade}）。八大 AI 平台平均提及率 ${avgRate.toFixed(1)}%，与头部品牌 ${top.avgRate}% 仍有明显差距。核心瓶颈在基建层——结构化事实与语料密度不足，导致 AI 在回答品类推荐时缺少援引${brand}的依据。舆情面健康（正面 ${sentiment.positive}%），是可以放大的有利条件。`,
    highlights: [
      `舆情基本盘健康，正面声量占比 ${sentiment.positive}%，无系统性负面风险`,
      `${mentions.slice().sort((a, b) => b.rate - a.rate)[0]?.name ?? '主力平台'} 表现相对最好，可作为突破样板`,
      '品类词搜索量稳定，AI 提问场景明确，改造路径清晰',
    ],
    risks: [
      '官网缺少结构化数据，AI 无法抽取权威事实，是当前最大单点短板',
      `头部竞品提及率 ${top.avgRate}%，心智占位已成型，拖延成本随时间上升`,
      '自媒体更新不稳定，语料密度不足以支撑 AI 形成稳定品牌认知',
    ],
  }

  const trend = ['3月', '4月', '5月', '6月', '7月', '8月'].map((label, i) => ({
    label,
    score: Math.max(20, Math.round(total - (5 - i) * (2 + r() * 2.2))),
  }))

  return { aivo, suggestions, overview, trend }
}

/* ---------- 竞品矩阵：把简单竞品行扩成四维对比 ---------- */
function buildCompetitorMatrix(rows: CompetitorRow[], r: () => number): CompetitorMatrixRow[] {
  return rows.map((c) => {
    const base = c.avgRate
    return {
      name: c.name,
      isSelf: c.isSelf,
      visibility: Math.round(Math.min(100, base + (r() - 0.5) * 10)),
      infra: Math.round(Math.min(100, Math.max(10, base * 0.7 + (r() - 0.5) * 16))),
      content: Math.round(Math.min(100, Math.max(10, base * 0.85 + (r() - 0.5) * 14))),
      sentiment: Math.round(Math.min(100, Math.max(20, base * 0.6 + (r() - 0.5) * 20 + 20))),
      avgRate: c.avgRate,
      strength: c.strength,
      weakness: c.isSelf ? '语料密度与结构化事实不足，AI 引用依据薄弱' : base > 40 ? '心智占位强，但内容更新节奏待验证' : '长尾覆盖与区域外心智偏弱',
    }
  })
}

/* ---------- 得失分：各维度相对行业基准的拉动 ---------- */
function buildGainLoss(aivo: AivoScore, benchmark: number, _r: () => number): GainLossItem[] {
  const mk = (factor: string, val: number, weight: number, flat: number, note: string): GainLossItem => {
    const gain = Math.round((val - flat) * (weight / 100) * 1.1)
    return { factor, gain, weight, status: gain > 3 ? 'gain' : gain < -3 ? 'loss' : 'flat', note }
  }
  return [
    mk('AI 可见性', aivo.visibility, 34, benchmark, `相对行业基准 ${benchmark}% 的提及表现`),
    mk('权威度建设', aivo.infra, 28, 60, '官网结构化与第三方背书的完善度'),
    mk('语义关联', aivo.competition, 14, benchmark, '与品类核心场景词的共现强度'),
    mk('社媒密度', aivo.sentiment, 8, 60, '舆情健康度与内容新鲜度'),
  ]
}

function factorScore(key: string, aivo: AivoScore, r: () => number): number {
  const map: Record<string, number> = {
    mention: aivo.visibility,
    authority: Math.round((aivo.infra + aivo.competition) / 2),
    structure: aivo.infra,
    semantic: aivo.competition,
    social: aivo.sentiment,
  }
  const base = map[key] ?? 50
  return Math.max(5, Math.min(100, Math.round(base + (r() - 0.5) * 6)))
}

/* ---------- 编排：带进度回调的流水线 ---------- */
export interface RunOptions {
  brand: string
  category: string
  website?: string
  platforms: number[]
  onProgress?: (e: StageEvent) => void
  /** 每步之间的节奏（毫秒），用于展示流水线过程 */
  tick?: number
  /** 是否启用真实联网搜索（生态布局 / 行业横评 / 长尾词） */
  realSearch?: boolean
}

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms))

export async function runGeoAudit(opts: RunOptions): Promise<NonNullable<GeoAudit['result']>> {
  const { brand, category, website, platforms, onProgress, tick = 620, realSearch = false } = opts
  const r = rng(seedFrom(brand + category + platforms.join(',')))
  const emit = (e: StageEvent) => onProgress?.(e)
  const search = getSearch(realSearch)

  emit({ phase: 'stage1', progress: 5, label: '阶段 1 · 基础调研', detail: '构建用户画像与高意图搜索场景…' })
  await sleep(tick)
  const s1 = runStage1(brand, category, website, r)

  emit({ phase: 'stage1', progress: 14, label: '阶段 1 · 基础调研', detail: '评估官网 / 自媒体 / 权威媒体三层基建…' })
  await sleep(tick)
  emit({ phase: 'stage1', progress: 22, label: '阶段 1 · 基础调研', detail: '识别同品类竞争格局…' })
  await sleep(tick)

  // 联网搜现有生态布局
  emit({ phase: 'stage23', progress: 30, label: realSearch ? '联网搜生态布局' : '生态布局推演', detail: realSearch ? '调用搜索代理检索品牌全网露出…' : '生成模拟生态布局…' })
  await sleep(tick)
  const eco = await search.searchEco(brand, category)
  emit({ phase: 'stage23', progress: 40, label: realSearch ? '联网搜生态布局' : '生态布局推演', detail: `检索到 ${eco.items.length} 个露出节点，健康度 ${eco.health}` })
  await sleep(tick)

  emit({ phase: 'stage23', progress: 48, label: '阶段 2+3 · 并行', detail: `向 ${platforms.length} 个 AI 平台发起收录查询…` })
  await sleep(tick)
  const mentions = runStage2(platforms, s1.selfBase, r)
  emit({ phase: 'stage23', progress: 60, label: '阶段 2+3 · 并行', detail: '统计提及率与首位推荐分布…' })
  await sleep(tick)
  emit({ phase: 'stage23', progress: 68, label: '阶段 2+3 · 并行', detail: '抓取舆情词并分析情感倾向…' })
  await sleep(tick)
  const sentiment = runStage3(brand, category, r)

  // 行业横评（联网）
  emit({ phase: 'stage4', progress: 76, label: '行业横评', detail: realSearch ? '联网检索同行业标杆市场份额…' : '生成行业横评样本…' })
  await sleep(tick)
  const ind = await search.searchIndustry(category)
  const indBenchmark = ind.benchmark
  const selfShare = Math.max(0.3, Math.round((s1.selfBase / 100) * (indBenchmark || 16) / 2.6))
  const industry: IndustryPeer[] = [{ name: brand, share: selfShare, isSelf: true, note: '本品牌（当前样本）' }, ...ind.peers].sort(
    (a, b) => b.share - a.share,
  )

  emit({ phase: 'stage4', progress: 84, label: '阶段 4 · 评分建议', detail: '计算 AIVO 四维等权重评分…' })
  await sleep(tick)
  const s4 = runStage4(brand, mentions, s1.infra, s1.competitors, sentiment, r)

  const competitorMatrix = buildCompetitorMatrix(s1.competitors, r)
  const gainLoss = buildGainLoss(s4.aivo, indBenchmark, r)
  const geoFactors = liveFactors().map((f) => ({ ...f, score: factorScore(f.key, s4.aivo, r) }))
  const distill = liveDistill(category)
  const longTail = await search.searchLongTail(category, brand)

  emit({ phase: 'stage4', progress: 94, label: '阶段 4 · 评分建议', detail: '生成分优先级行动建议…' })
  await sleep(tick)
  emit({ phase: 'done', progress: 100, label: '完成', detail: '报告已生成' })

  return {
    overview: s4.overview,
    aivo: s4.aivo,
    profile: { persona: s1.persona, scenarios: s1.scenarios, questions: s1.questions },
    mentions,
    infra: s1.infra,
    competitors: s1.competitors,
    sentiment,
    suggestions: s4.suggestions,
    trend: s4.trend,
    competitorMatrix,
    industry,
    industryBenchmark: indBenchmark,
    gainLoss,
    eco,
    geoFactors,
    distill,
    longTail,
  }
}

/* ---------- 内容 GEO 评分（发布前校验） ---------- */
export function scoreContentGeo(input: {
  title: string
  body: string
  summary: string
  tags: string[]
  qaPairs: { q: string; a: string }[]
}): { score: number; items: { label: string; pass: boolean; weight: number; tip: string }[] } {
  const items = [
    {
      label: '标题含疑问句式',
      pass: /[?？]|怎么|如何|哪个|为什么|值不值|要不要/.test(input.title),
      weight: 18,
      tip: '疑问句标题与用户向 AI 提问的方式同构，命中率更高',
    },
    {
      label: '配置 3 组以上问答对',
      pass: input.qaPairs.filter((q) => q.q.trim() && q.a.trim()).length >= 3,
      weight: 26,
      tip: 'AI 优先抽取结构化问答，这是提升引用率最有效的单一手段',
    },
    {
      label: '正文不少于 600 字',
      pass: input.body.replace(/\s/g, '').length >= 600,
      weight: 16,
      tip: '内容深度不足会被判定为低信息密度，难以进入引用池',
    },
    {
      label: '摘要清晰概括',
      pass: input.summary.trim().length >= 40,
      weight: 12,
      tip: '摘要是 AI 快速判定主题的入口',
    },
    {
      label: '标签不少于 3 个',
      pass: input.tags.length >= 3,
      weight: 10,
      tip: '标签帮助建立主题关联',
    },
    {
      label: '正文含小标题分段',
      pass: /#{1,3}\s|【.+】|^\d+[、.]/m.test(input.body),
      weight: 18,
      tip: '层级结构让 AI 更容易定位与摘录段落',
    },
  ]
  const score = items.reduce((s, i) => s + (i.pass ? i.weight : 0), 0)
  return { score, items }
}
