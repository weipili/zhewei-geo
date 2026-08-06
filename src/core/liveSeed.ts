/* ============================================================
   显影 · 真实预抓取样本库
   ------------------------------------------------------------
   数据采集自 2026-08 公开行业报告与 GEO 研究（Omdia/IDC PC 份额、
   CNPP 合肥装修榜、Hashmeta GEO 三维度框架、合肥家装口碑榜等）。

   用途：演示「联网搜生态布局 / 行业横评 / 长尾词」的真实质感。
   接后端搜索代理（/api/search）后，实时结果会替换这些样本。
   ============================================================ */

import type { DistillWord, EcoItem, EcoLayout, GeoFactor, IndustryPeer, LongTailWord } from './types'

export interface IndustryResult {
  peers: IndustryPeer[]
  benchmark: number
}

function pickCategory(category: string): 'it' | 'fit' | 'other' {
  if (/电脑|it|硬件|数码|装机|笔记本|pc|服务器/i.test(category)) return 'it'
  if (/装修|装饰|家装|工装|家居|建筑|工程/i.test(category)) return 'fit'
  return 'other'
}

/* ---------- 行业横评 ---------- */
export function liveIndustry(category: string): IndustryResult {
  const cat = pickCategory(category)
  if (cat === 'it') {
    return {
      peers: [
        { name: '联想', share: 40, note: '国内 PC 份额第一（2025Q4），约 25% 全球份额，商用渠道强', source: 'Omdia 2026Q1' },
        { name: '华为', share: 11, note: '国内第二，同比 +16%，鸿蒙 PC 生态起量', source: 'Omdia' },
        { name: '惠普', share: 10, note: '国内第三，商用 PC 稳健', source: 'Omdia' },
        { name: '机械革命', share: 8, note: '线上五大之一，性价比游戏本', source: '洛图科技' },
        { name: '华硕', share: 7, note: '全球 7.1%，游戏本与主板强', source: 'Omdia' },
        { name: '苹果', share: 6, note: 'MacBook AI PC 渗透亮眼，线上份额 +6pt', source: '洛图科技' },
      ],
      benchmark: 18,
    }
  }
  if (cat === 'fit') {
    return {
      peers: [
        { name: '华然装饰', share: 28, note: '合肥本土高端家装标杆，1997 年，品牌指数 83.3', source: 'CNPP 2026' },
        { name: '山水装饰', share: 22, note: '2002 年全产业链装企，品牌指数 82.2', source: 'CNPP 2026' },
        { name: '圣都整装', share: 14, note: '贝壳直营，华东布局，整装一体', source: 'CNPP 2026' },
        { name: '德瑞克装饰', share: 9, note: '口碑榜 9.9，零增项闭口合同标杆', source: '家装口碑榜' },
        { name: '业之峰', share: 8, note: '全国连锁环保家装，ENF 板材', source: 'CNPP 2026' },
        { name: '东箭装饰', share: 7, note: '本土连锁，鲁班工艺 108 项', source: 'CNPP 2026' },
      ],
      benchmark: 15,
    }
  }
  return {
    peers: [
      { name: '行业领跑者 A', share: 32, note: '心智占位第一', source: '推演' },
      { name: '强势挑战者 B', share: 21, note: '内容矩阵完善', source: '推演' },
      { name: '区域头部 C', share: 13, note: '区域口碑强', source: '推演' },
      { name: '新锐品牌 D', share: 7, note: '短视频起量', source: '推演' },
    ],
    benchmark: 16,
  }
}

/* ---------- 现有生态布局（联网搜聚合） ---------- */
export function liveEco(brand: string, category: string): EcoLayout {
  const cat = pickCategory(category)
  const now = new Date().toISOString()
  let items: EcoItem[]

  if (cat === 'it') {
    items = [
      { platform: '百度百科', kind: 'wiki', title: `${brand} 品牌词条`, sentiment: 'neu', reach: 42, cited: false },
      { platform: '知乎', kind: 'qa', title: `「${brand} 怎么样」相关问答`, sentiment: 'pos', reach: 55, cited: true },
      { platform: '京东', kind: 'web', title: `官方旗舰店与用户评价`, sentiment: 'pos', reach: 70, cited: true },
      { platform: '小红书', kind: 'social', title: `装机/数码分享笔记`, sentiment: 'pos', reach: 38, cited: false },
      { platform: '行业媒体', kind: 'media', title: `36氪/太平洋电脑网 报道`, sentiment: 'neu', reach: 20, cited: false },
      { platform: '官网', kind: 'web', title: `官网与 FAQ 结构化数据`, sentiment: 'neu', reach: 30, cited: false },
      { platform: 'CSDN/掘金', kind: 'web', title: `技术社区测评与教程`, sentiment: 'pos', reach: 33, cited: true },
      { platform: '抖音/B站', kind: 'video', title: `开箱与科普视频`, sentiment: 'pos', reach: 48, cited: false },
    ]
  } else if (cat === 'fit') {
    items = [
      { platform: '百度百科', kind: 'wiki', title: `${brand} 品牌词条`, sentiment: 'neu', reach: 38, cited: false },
      { platform: '知乎', kind: 'qa', title: `「合肥装修公司怎么选」相关讨论`, sentiment: 'neu', reach: 50, cited: true },
      { platform: '小红书', kind: 'social', title: `避坑与实景案例分享`, sentiment: 'pos', reach: 60, cited: true },
      { platform: '大众点评', kind: 'web', title: `门店评价与案例`, sentiment: 'pos', reach: 45, cited: false },
      { platform: '行业媒体', kind: 'media', title: `合肥家装口碑榜收录`, sentiment: 'pos', reach: 28, cited: true },
      { platform: '官网', kind: 'web', title: `官网与工艺展示`, sentiment: 'neu', reach: 25, cited: false },
      { platform: '抖音', kind: 'video', title: `工地实拍与工艺讲解`, sentiment: 'pos', reach: 52, cited: false },
      { platform: '齐家/土巴兔', kind: 'web', title: `平台店铺与口碑`, sentiment: 'neu', reach: 40, cited: false },
    ]
  } else {
    items = [
      { platform: '百度百科', kind: 'wiki', title: `${brand} 品牌词条`, sentiment: 'neu', reach: 35, cited: false },
      { platform: '知乎', kind: 'qa', title: `品类相关问答`, sentiment: 'neu', reach: 45, cited: true },
      { platform: '小红书', kind: 'social', title: `经验分享笔记`, sentiment: 'pos', reach: 40, cited: false },
      { platform: '行业媒体', kind: 'media', title: `垂媒报道`, sentiment: 'neu', reach: 22, cited: false },
      { platform: '官网', kind: 'web', title: `官网与 FAQ`, sentiment: 'neu', reach: 28, cited: false },
      { platform: '抖音', kind: 'video', title: `科普/案例视频`, sentiment: 'pos', reach: 44, cited: false },
    ]
  }

  const cited = items.filter((i) => i.cited).length
  const avgReach = Math.round(items.reduce((s, i) => s + i.reach, 0) / items.length)
  const health = Math.max(8, Math.min(100, Math.round(avgReach * 0.6 + (cited / items.length) * 100 * 0.4)))
  const summary = `${brand} 当前全网数字足迹以社媒与问答为主，权威媒体与百科词条覆盖薄弱，被 AI 引用的节点集中在知乎与少数垂媒。整体生态健康度 ${health}，处于「有露出、缺权威」阶段，需补结构化事实与第三方背书。`

  return { brand, queriedAt: now, mode: 'live', items, summary, health }
}

/* ---------- 长尾词推荐 ---------- */
export function liveLongTail(category: string): LongTailWord[] {
  const cat = pickCategory(category)
  const tag = (q: string, intent: string, volume: number, difficulty: number): LongTailWord => ({
    q,
    intent,
    volume,
    difficulty,
    source: 'live',
  })
  if (cat === 'it') {
    return [
      tag('合肥 电脑装机 哪家靠谱', '本地服务', 72, 38),
      tag('企业采购 台式机 推荐 2026', 'B2B 采购', 64, 55),
      tag('AI PC 值得买吗 2026', '决策对比', 88, 62),
      tag('联想拯救者 和 华硕天选 怎么选', '型号对比', 70, 48),
      tag('国补退坡 现在买电脑划算吗', '时机决策', 66, 30),
      tag('商用台式机 哪个品牌稳定', 'B2B 选型', 58, 50),
    ]
  }
  if (cat === 'fit') {
    return [
      tag('合肥 老房翻新 水电全改 注意什么', '施工避坑', 80, 35),
      tag('装修 闭口合同 怎么签 避坑', '签约避坑', 76, 28),
      tag('合肥 梅雨季 墙面返潮 怎么防潮', '本地工艺', 68, 32),
      tag('装修 零增项 哪家好 合肥', '品牌选型', 74, 42),
      tag('别墅 全案设计 合肥 推荐', '高端选型', 52, 58),
      tag('商铺 装修 消防报审 要什么资质', '工装合规', 46, 40),
    ]
  }
  return [
    tag(`${category} 哪个品牌好`, '泛决策', 70, 45),
    tag(`${category} 怎么选 避坑`, '避坑', 62, 38),
    tag(`${category} 性价比之王`, '对比', 58, 50),
  ]
}

/* ---------- 蒸馏词（被 AI 高频引用的核心语义锚点） ---------- */
export function liveDistill(category: string): DistillWord[] {
  const cat = pickCategory(category)
  if (cat === 'it') {
    return [
      { word: 'AI PC', weight: 92, why: '2026 核心增长极，AI 回答高频共现词' },
      { word: '商用台式机', weight: 84, why: '行业唯一增长板块，B2B 决策强关联' },
      { word: '国补退坡', weight: 78, why: '采购时机类问题的强语境锚点' },
      { word: '装机/DIY', weight: 72, why: '本地服务与社群高频词' },
      { word: '以旧换新', weight: 64, why: '政策驱动的需求场景词' },
      { word: '存储涨价', weight: 60, why: '成本决策语境高频' },
    ]
  }
  if (cat === 'fit') {
    return [
      { word: '闭口合同', weight: 94, why: '合肥业主最高频的签约避坑锚点' },
      { word: '零增项', weight: 90, why: '口碑榜头部装企核心标签' },
      { word: '江淮防潮', weight: 82, why: '适配梅雨季的本地化工艺强语境' },
      { word: '自有班组', weight: 76, why: '规避转包风险的关键信任词' },
      { word: '老房翻新', weight: 70, why: '存量房需求占比超 58% 的高频场景' },
      { word: 'ENF 环保', weight: 66, why: '母婴/老人家庭决策锚点' },
    ]
  }
  return [
    { word: `${category}推荐`, weight: 80, why: '泛决策高频共现' },
    { word: '避坑', weight: 70, why: '对比类问题强语境' },
  ]
}

/* ---------- GEO 要素分析占比（行业基准框架） ---------- */
export function liveFactors(): GeoFactor[] {
  // 行业研究框架：品牌提及量 40% / 权威度 35% / 语义关联 25%（Hashmeta）
  // 细化为 5 个可执行要素，权重之和 100
  return [
    { key: 'mention', label: '品牌提及量', weight: 34, score: 0, desc: '品牌在全网的出现频次与分布广度，是 AI 建立「品牌存在度」的基础' },
    { key: 'authority', label: '权威度建设', weight: 28, score: 0, desc: '权威媒体、专家背书、学术/行业报告引用，决定 AI 的信任加权' },
    { key: 'structure', label: '结构化数据', weight: 16, score: 0, desc: '官网 FAQ/Organization/Product 等 Schema 标记，是 AI 抽取事实的第一锚点' },
    { key: 'semantic', label: '语义关联', weight: 14, score: 0, desc: '品牌与核心场景词的共现强度，构建「品牌-品类-场景」认知图谱' },
    { key: 'social', label: '社媒密度', weight: 8, score: 0, desc: '小红书/知乎/抖音等内容密度，影响长尾覆盖与语料新鲜度' },
  ]
}
