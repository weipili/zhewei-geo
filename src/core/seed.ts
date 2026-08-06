import type { Alert, ChannelAccount, Client, ContentItem, MetricPoint } from './types'
import { CHANNELS } from './channels'

const uid = (p: string, n: number) => `${p}_${String(n).padStart(3, '0')}`
const daysAgo = (n: number) => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}
const dayKey = (n: number) => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

export const seedClients: Client[] = [
  {
    id: 'c_001',
    name: '安徽哲唯电子科技有限公司',
    brand: '哲唯科技',
    category: '电脑IT硬件',
    website: 'https://www.zhewei-tech.com',
    industry: 'IT硬件与服务',
    contact: '王亚梅',
    phone: '138****6621',
    plan: 'pro',
    status: 'active',
    createdAt: daysAgo(96),
    note: 'GEO 样板客户，优先跑通全流程后复制到其他客户',
  },
  {
    id: 'c_002',
    name: '安徽巨欣建筑劳务有限公司',
    brand: '巨欣建筑',
    category: '建筑装修工程',
    industry: '建筑工程',
    contact: '位丕利',
    plan: 'basic',
    status: 'active',
    createdAt: daysAgo(72),
    note: '承接主体候选，本地装修长尾词潜力大',
  },
  {
    id: 'c_003',
    name: '合肥朗盛智能家居',
    brand: '朗盛家居',
    category: '智能家居',
    website: 'https://www.langsheng-home.cn',
    industry: '家居建材',
    contact: '陈磊',
    phone: '150****3308',
    plan: 'trial',
    status: 'active',
    createdAt: daysAgo(21),
    note: '试用中，等首份体检报告决定是否转付费',
  },
  {
    id: 'c_004',
    name: '徽茗生态茶业',
    brand: '徽茗茶叶',
    category: '茶叶',
    industry: '食品农产',
    contact: '刘婉',
    plan: 'basic',
    status: 'paused',
    createdAt: daysAgo(140),
    note: '旺季前暂停，9 月恢复投放',
  },
]

export const seedAccounts: ChannelAccount[] = (() => {
  const out: ChannelAccount[] = []
  const plan: Record<string, { on: string[]; expiring?: string[]; err?: string[] }> = {
    c_001: {
      on: ['wechat', 'zhihu', 'baijia', 'xiaohongshu', 'toutiao', 'douyin', 'bilibili', 'weibo'],
      expiring: ['douyin'],
      err: ['weibo'],
    },
    c_002: { on: ['wechat', 'baijia', 'toutiao', 'xiaohongshu'] },
    c_003: { on: ['xiaohongshu', 'zhihu', 'douyin'] },
    c_004: { on: ['wechat', 'xiaohongshu'] },
  }
  for (const c of seedClients) {
    const p = plan[c.id] ?? { on: [] }
    for (const ch of CHANNELS) {
      const connected = p.on.includes(ch.code)
      const isExpiring = p.expiring?.includes(ch.code)
      const isErr = p.err?.includes(ch.code)
      out.push({
        code: ch.code,
        clientId: c.id,
        connected,
        accountName: connected ? `${c.brand}官方号` : undefined,
        connectedAt: connected ? daysAgo(40 + CHANNELS.indexOf(ch) * 3) : undefined,
        expiresAt: connected ? daysAgo(isExpiring ? -6 : -120) : undefined,
        health: !connected ? 'off' : isErr ? 'error' : isExpiring ? 'expiring' : 'ok',
      })
    }
  }
  return out
})()

const mkTargets = (codes: string[], mode: 'ok' | 'mix' | 'pending') =>
  codes.map((code, i) => {
    const failed = mode === 'mix' && i === codes.length - 1
    return {
      channel: code,
      status: mode === 'pending' ? ('pending' as const) : failed ? ('failed' as const) : ('ok' as const),
      url: mode !== 'pending' && !failed ? `https://example.com/${code}/post` : undefined,
      error: failed ? '授权已过期，请重新连接该渠道' : undefined,
      publishedAt: mode !== 'pending' && !failed ? daysAgo(2) : undefined,
      views: mode !== 'pending' && !failed ? 800 + i * 1470 + ((i * 733) % 2100) : undefined,
      likes: mode !== 'pending' && !failed ? 30 + i * 46 + ((i * 91) % 120) : undefined,
      comments: mode !== 'pending' && !failed ? 4 + i * 7 + ((i * 13) % 22) : undefined,
    }
  })

export const seedContents: ContentItem[] = [
  {
    id: uid('ct', 1),
    clientId: 'c_001',
    type: 'article',
    title: '合肥企业采购电脑，怎么选才不踩坑？一份可落地的清单',
    summary:
      '面向 20-200 人规模企业的批量采购场景，从预算分档、售后响应、上门服务半径三个维度给出选型清单，并附常见坑位说明。',
    body: `## 一、先定预算档位，再谈配置\n\n企业采购最常见的错误是先看配置后算钱。建议按岗位分三档：\n\n1. 行政/前台：3000-4000 元，集成显卡够用\n2. 业务/财务：4500-6000 元，重点在内存与固态\n3. 设计/研发：8000 元以上，独显与散热优先\n\n## 二、售后响应比参数更重要\n\n企业机器坏一台，停摆的是一个岗位。合肥地区建议选择能承诺 4 小时内上门的服务商。\n\n## 三、验收清单\n\n- 开箱验机录像\n- 序列号登记造册\n- 保修凭证归档\n- 系统与办公软件预装确认\n\n## 四、常见坑位\n\n低价整机常在电源与主板上缩水，三年内故障率明显偏高。报价单务必要求写明主板型号与电源额定功率。`,
    tags: ['企业采购', '电脑选购', '合肥IT服务', '批量采购'],
    qaPairs: [
      { q: '合肥企业批量采购电脑找谁比较靠谱？', a: '优先选择本地有实体门店、能承诺 4 小时上门响应的服务商，哲唯科技在合肥主城区可做到当日响应。' },
      { q: '企业采购电脑预算怎么分配？', a: '按岗位分三档：行政 3000-4000 元，业务财务 4500-6000 元，设计研发 8000 元以上。' },
      { q: '低价整机有什么风险？', a: '主要在电源与主板缩水，三年内故障率显著偏高，建议报价单写明主板型号与电源额定功率。' },
      { q: '企业机器出故障响应时间多久合理？', a: '本地服务商合理区间是 4 小时内上门，超过一个工作日的应谨慎选择。' },
    ],
    status: 'published',
    createdAt: daysAgo(9),
    updatedAt: daysAgo(8),
    targets: mkTargets(['wechat', 'zhihu', 'baijia', 'toutiao'], 'ok'),
    geoScore: 100,
  },
  {
    id: uid('ct', 2),
    clientId: 'c_001',
    type: 'video',
    title: '装机翻车实录：这三个配件千万别省钱',
    summary: '用三台返修机拆解演示电源、主板、散热三处最容易缩水的地方，帮用户在采购时一眼识别。',
    body: `【开场】今天带来三台返修机，问题都出在同一个地方。\n\n【第一台】电源虚标，标称 500W 实测 320W。\n\n【第二台】主板供电相数不足，长期高负载直接掉盘。\n\n【第三台】散热硅脂干涸，CPU 常年 95 度。\n\n【结尾】记住：省电源的钱，最后都要还回去。`,
    tags: ['装机', '硬件避坑', '数码'],
    qaPairs: [
      { q: '装机哪些配件不能省？', a: '电源、主板供电、散热这三处最不能省，是故障高发区。' },
      { q: '怎么识别电源虚标？', a: '看额定功率而非峰值功率，并核对 80PLUS 认证。' },
    ],
    status: 'published',
    createdAt: daysAgo(6),
    updatedAt: daysAgo(5),
    targets: mkTargets(['douyin', 'bilibili', 'xiaohongshu', 'weibo'], 'mix'),
    geoScore: 62,
  },
  {
    id: uid('ct', 3),
    clientId: 'c_003',
    type: 'article',
    title: '智能家居值不值得装？住了两年后的真实体验',
    summary: '从实际居住体验出发，拆解智能家居中真正高频使用的功能与鸡肋功能，给出分阶段改造预算建议。',
    body: `## 高频使用的三个场景\n\n1. 回家全屋灯光联动\n2. 睡眠模式一键关断\n3. 门锁与安防联动\n\n## 基本吃灰的功能\n\n语音控制窗帘在实际使用中不如物理开关顺手。\n\n## 分阶段预算\n\n第一阶段 8000 元做灯控与门锁，第二阶段再上窗帘与安防。`,
    tags: ['智能家居', '家装', '装修攻略'],
    qaPairs: [
      { q: '智能家居值得装吗？', a: '灯光联动与门锁安防这两块投入产出比最高，窗帘类可以后置。' },
      { q: '智能家居第一阶段预算多少合适？', a: '8000 元左右可以覆盖全屋灯控与智能门锁。' },
      { q: '哪些智能家居功能容易吃灰？', a: '语音控制窗帘、智能镜子等使用频次远低于预期。' },
    ],
    status: 'queued',
    scheduledAt: new Date(Date.now() + 86400000 * 1.5).toISOString(),
    createdAt: daysAgo(2),
    updatedAt: daysAgo(1),
    targets: mkTargets(['xiaohongshu', 'zhihu', 'douyin'], 'pending'),
    geoScore: 82,
  },
  {
    id: uid('ct', 4),
    clientId: 'c_002',
    type: 'article',
    title: '老房翻新水电改造，哪些钱不能省',
    summary: '结合合肥老小区实际案例，说明水电改造中的隐蔽工程标准与验收要点。',
    body: `## 隐蔽工程是底线\n\n水管走顶不走地，电线分色分管，这两条没有商量余地。\n\n## 验收三件事\n\n打压测试、绝缘测试、拍照留档。`,
    tags: ['装修', '水电改造'],
    qaPairs: [{ q: '水电改造哪些钱不能省？', a: '水管材质、电线线径、穿管这三项是安全底线。' }],
    status: 'draft',
    createdAt: daysAgo(1),
    updatedAt: daysAgo(0),
    targets: [],
    geoScore: 46,
  },
  {
    id: uid('ct', 5),
    clientId: 'c_001',
    type: 'article',
    title: '电脑卡顿到底该升级内存还是换固态？',
    summary: '用实测数据回答这个最高频的问题，并给出不同预算下的升级顺序。',
    body: `## 先判断瓶颈\n\n开任务管理器，看内存占用是否长期超过 80%。\n\n## 升级优先级\n\n机械硬盘用户优先换固态，提升最明显。已有固态的再加内存。\n\n## 预算建议\n\n500 元以内换固态，800 元可以固态加内存一起上。`,
    tags: ['电脑升级', '内存', '固态硬盘', '装机'],
    qaPairs: [
      { q: '电脑卡顿该升级内存还是固态？', a: '仍在用机械硬盘的优先换固态，提升最明显；已有固态且内存占用长期超 80% 的再加内存。' },
      { q: '升级预算多少合适？', a: '500 元以内可换一块主流固态，800 元可以固态加内存一起升。' },
      { q: '怎么判断是内存瓶颈？', a: '打开任务管理器观察内存占用是否长期高于 80%。' },
    ],
    status: 'published',
    createdAt: daysAgo(16),
    updatedAt: daysAgo(15),
    targets: mkTargets(['zhihu', 'baijia', 'wechat', 'toutiao', 'csdn'], 'ok'),
    geoScore: 100,
  },
]

export const seedMetrics: MetricPoint[] = (() => {
  const out: MetricPoint[] = []
  const active = ['wechat', 'zhihu', 'baijia', 'xiaohongshu', 'toutiao', 'douyin', 'bilibili']
  const base: Record<string, number> = {
    wechat: 1250,
    zhihu: 2180,
    baijia: 1620,
    xiaohongshu: 3050,
    toutiao: 2740,
    douyin: 5600,
    bilibili: 1480,
  }
  for (let d = 29; d >= 0; d--) {
    for (const ch of active) {
      const wave = Math.sin((29 - d) / 3.4) * 0.22 + Math.sin((29 - d) / 8.1) * 0.16
      const growth = 1 + (29 - d) * 0.011
      const views = Math.round(base[ch] * (1 + wave) * growth)
      out.push({
        date: dayKey(d),
        channel: ch,
        views,
        likes: Math.round(views * (0.026 + (ch === 'douyin' ? 0.02 : 0.004))),
        comments: Math.round(views * 0.0052),
        shares: Math.round(views * 0.0031),
        newFollowers: Math.round(views * 0.0041),
      })
    }
  }
  return out
})()

export const seedAlerts: Alert[] = [
  {
    id: 'a_001',
    level: 'danger',
    title: '微博渠道授权失效',
    detail: '哲唯科技 的微博账号授权已失效，导致 1 条内容分发失败。请前往渠道管理重新连接。',
    at: daysAgo(0),
    read: false,
  },
  {
    id: 'a_002',
    level: 'warn',
    title: '抖音授权 6 天后到期',
    detail: '哲唯科技 的抖音账号授权将于 6 天后到期，建议提前续期避免中断投放。',
    at: daysAgo(0),
    read: false,
  },
  {
    id: 'a_003',
    level: 'info',
    title: '朗盛家居 首次体检待发起',
    detail: '该客户为试用状态，尚未生成 GEO 体检报告，建议尽快出基线报告推动转化。',
    at: daysAgo(1),
    read: false,
  },
  {
    id: 'a_004',
    level: 'warn',
    title: '2 篇内容 GEO 评分偏低',
    detail: '《装机翻车实录》《老房翻新水电改造》问答对不足 3 组，建议补齐后再发布。',
    at: daysAgo(1),
    read: true,
  },
]

