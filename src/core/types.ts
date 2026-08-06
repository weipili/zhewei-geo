/* ============================================================
   哲唯科技 · 领域模型
   ============================================================ */

/** ---------- 客户 / 品牌 ---------- */
export interface Client {
  id: string
  name: string
  brand: string
  category: string
  website?: string
  industry: string
  contact: string
  phone?: string
  plan: 'trial' | 'basic' | 'pro' | 'enterprise'
  status: 'active' | 'paused' | 'churned'
  createdAt: string
  note?: string
}

/** ---------- 渠道 ---------- */
export type ChannelKind = 'article' | 'video' | 'both'

export interface ChannelDef {
  code: string
  name: string
  kind: ChannelKind
  /** 品牌色，用于图形标识 */
  hue: string
  /** 单篇正文字数上限，0=不限 */
  bodyLimit: number
  titleLimit: number
  /** 支持的能力 */
  caps: {
    cover: boolean
    tags: boolean
    schedule: boolean
    /** 是否被主流 AI 大模型高频引用（GEO 价值权重） */
    geoWeight: number // 0-100
  }
  tip: string
}

export type AuthMethod = 'oauth' | 'apikey' | 'cookie'

export interface ChannelAccount {
  code: string
  clientId: string
  connected: boolean
  accountName?: string
  connectedAt?: string
  /** 授权过期日 */
  expiresAt?: string
  health: 'ok' | 'expiring' | 'error' | 'off'
  /** 授权方式 */
  authMethod?: AuthMethod
  /** 凭证占位（演示环境明文存储；真实环境应存后端、仅前端持 token） */
  credential?: string
  /** 已授权范围 */
  scopes?: string[]
  /** 最近一次成功同步时间 */
  lastSync?: string
  /** 授权流程步骤 */
  connectStep?: 'idle' | 'authorizing' | 'callback' | 'done'
  /** 授权失败原因 */
  error?: string
  /** OAuth 跳转地址（演示为占位） */
  authUrl?: string
}

/** ---------- 内容 ---------- */
export type ContentStatus = 'draft' | 'queued' | 'publishing' | 'published' | 'partial' | 'failed'

export interface DispatchTarget {
  channel: string
  status: 'pending' | 'ok' | 'failed' | 'skipped'
  url?: string
  error?: string
  publishedAt?: string
  /** 该渠道单独的表现 */
  views?: number
  likes?: number
  comments?: number
}

export interface ContentItem {
  id: string
  clientId: string
  type: 'article' | 'video'
  title: string
  summary: string
  body: string
  tags: string[]
  cover?: string
  /** GEO 结构化增强：问答对，显著提升被 AI 引用概率 */
  qaPairs: { q: string; a: string }[]
  status: ContentStatus
  scheduledAt?: string
  createdAt: string
  updatedAt: string
  targets: DispatchTarget[]
  /** GEO 优化评分 0-100 */
  geoScore: number
}

/** ---------- GEO 体检 ---------- */
export const AI_PLATFORMS = [
  { code: 1, name: 'DeepSeek', short: 'DS' },
  { code: 2, name: '豆包', short: '豆包' },
  { code: 3, name: '元宝', short: '元宝' },
  { code: 4, name: '通义千问', short: '通义' },
  { code: 5, name: '文心一言', short: '文心' },
  { code: 6, name: '纳米搜索', short: '纳米' },
  { code: 7, name: 'Kimi', short: 'Kimi' },
  { code: 8, name: '智谱清言', short: '智谱' },
] as const

export type AuditStage = 'USER_PROFILE' | 'INFRA_EVAL' | 'COMPETITOR' | 'AI_SEARCH' | 'GEO_EFFECT' | 'SENTIMENT' | 'OVERVIEW' | 'AIVO_SCORE' | 'SUGGESTION'

export type AuditPhase = 'idle' | 'stage1' | 'stage23' | 'stage4' | 'done' | 'failed'

export interface PlatformMention {
  code: number
  name: string
  /** 提及率 % */
  rate: number
  /** 首位推荐次数 */
  firstPlace: number
  /** 样本问题数 */
  samples: number
  /** 数据来源 */
  source: 'search' | 'virtual'
}

export interface CompetitorRow {
  name: string
  avgRate: number
  isSelf: boolean
  strength: string
}

export interface InfraItem {
  name: string
  score: number
  max: number
  status: 'ok' | 'warn' | 'bad'
  finding: string
}

export interface Suggestion {
  priority: 'P0' | 'P1' | 'P2'
  title: string
  detail: string
  effort: '低' | '中' | '高'
  impact: '低' | '中' | '高'
  owner: string
}

export interface AivoScore {
  visibility: number
  infra: number
  competition: number
  sentiment: number
  total: number
  grade: '优秀' | '良好' | '一般' | '较差'
}

/* ---------- GEO 增强维度（竞品矩阵 / 行业横评 / 得失分 / 生态布局 / 要素占比 / 蒸馏词 / 长尾词） ---------- */

/** 竞品逐项对比矩阵：每个品牌在 4 个 GEO 子维度的表现 */
export interface CompetitorMatrixRow {
  name: string
  isSelf: boolean
  /** 各子维度得分 0-100 */
  visibility: number
  infra: number
  content: number
  sentiment: number
  /** 综合提及率 % */
  avgRate: number
  strength: string
  weakness: string
}

/** 行业横评样本：同行业标杆品牌市场份额 */
export interface IndustryPeer {
  name: string
  /** 市场份额 % */
  share: number
  isSelf?: boolean
  note: string
  /** 数据来源描述 */
  source?: string
}

/** 得失分：各 GEO 要素对本品牌评分的拉动 / 拖累 */
export interface GainLossItem {
  factor: string
  /** 正=加分，负=扣分（相对行业均值的偏离） */
  gain: number
  /** 该要素权重 % */
  weight: number
  status: 'gain' | 'loss' | 'flat'
  note: string
}

/** 联网搜到的生态布局条目 */
export interface EcoItem {
  platform: string
  kind: 'web' | 'media' | 'social' | 'wiki' | 'qa' | 'video'
  title: string
  url?: string
  sentiment: 'pos' | 'neu' | 'neg'
  /** 覆盖度 0-100 */
  reach: number
  /** 是否被 AI 引用 */
  cited: boolean
}

/** 现有生态布局（联网检索结果聚合） */
export interface EcoLayout {
  brand: string
  queriedAt: string
  mode: 'live' | 'mock'
  items: EcoItem[]
  summary: string
  /** 生态健康度 0-100 */
  health: number
}

/** GEO 要素分析占比（行业基准 + 本品牌表现） */
export interface GeoFactor {
  key: string
  label: string
  /** 行业基准权重 % */
  weight: number
  /** 本品牌当前表现 0-100 */
  score: number
  desc: string
}

/** 蒸馏词：被 AI 高频引用的核心语义锚点 */
export interface DistillWord {
  word: string
  /** 蒸馏权重 0-100 */
  weight: number
  why: string
}

/** 长尾词推荐：用户向 AI 提问的高意图长尾问题 */
export interface LongTailWord {
  q: string
  intent: string
  /** 估计热度 0-100 */
  volume: number
  /** 竞争度 0-100 */
  difficulty: number
  source: 'mock' | 'live'
}

export interface GeoAudit {
  id: string
  clientId: string
  brand: string
  category: string
  website?: string
  platforms: number[]
  phase: AuditPhase
  progress: number
  createdAt: string
  finishedAt?: string
  /** 分阶段产物 */
  result?: {
    overview: { summary: string; highlights: string[]; risks: string[] }
    aivo: AivoScore
    profile: { persona: string; scenarios: string[]; questions: string[] }
    mentions: PlatformMention[]
    infra: InfraItem[]
    competitors: CompetitorRow[]
    sentiment: { positive: number; neutral: number; negative: number; topics: { word: string; heat: number; tone: 'pos' | 'neu' | 'neg' }[] }
    suggestions: Suggestion[]
    /** 历史趋势（近 6 期） */
    trend: { label: string; score: number }[]

    /* ---- 增强维度 ---- */
    /** 竞品逐项对比矩阵 */
    competitorMatrix: CompetitorMatrixRow[]
    /** 行业横评样本（同行业标杆） */
    industry: IndustryPeer[]
    /** 行业平均提及率基准 */
    industryBenchmark: number
    /** 得失分归因 */
    gainLoss: GainLossItem[]
    /** 联网搜到的现有生态布局 */
    eco: EcoLayout
    /** GEO 要素分析占比（行业基准 + 本品牌表现） */
    geoFactors: GeoFactor[]
    /** 蒸馏词 */
    distill: DistillWord[]
    /** 长尾词推荐 */
    longTail: LongTailWord[]
  }
}

/** ---------- 运营指标 ---------- */
export interface MetricPoint {
  date: string
  channel: string
  views: number
  likes: number
  comments: number
  shares: number
  newFollowers: number
}

/** ---------- 通知 ---------- */
export interface Alert {
  id: string
  level: 'info' | 'warn' | 'danger'
  title: string
  detail: string
  at: string
  read: boolean
}

