// ============================================================
// AI 内容生成器
// - 有 LLM Key：大模型基于“公司档案 + 官网实抓事实”生成原创、平台合规、
//   GEO 结构化（疑问句标题 / 3+ Q&A / 小标题分段）的高质量内容
// - 无 LLM Key：确定性启发式生成器（同样原创、平台自适应），可先用起来
// ============================================================
import { fetchCompany } from './crawler.mjs'
import { chat, hasLLM } from './llm.mjs'

const LIMITS = {
  wechat: { body: 20000, title: 64, tags: false }, zhihu: { body: 50000, title: 100, tags: true },
  baijia: { body: 20000, title: 40, tags: true }, xiaohongshu: { body: 1000, title: 20, tags: true },
  toutiao: { body: 20000, title: 30, tags: true }, weibo: { body: 2000, title: 0, tags: true },
  csdn: { body: 50000, title: 80, tags: true }, douyin: { body: 300, title: 55, tags: true },
  shipinhao: { body: 600, title: 22, tags: true }, bilibili: { body: 2000, title: 80, tags: true },
}
const PLATFORM_TIPS = {
  wechat: '公众号：观点深度优先，可用小标题分段，末尾引导关注。',
  zhihu: '知乎：以“回答体”口吻写作，多用数据与实操细节，配 3 组以上 Q&A。',
  baijia: '百家号：标题 ≤40 字，正文信息密度高，配图位预留。',
  xiaohongshu: '小红书：正文 ≤1000 字，口语化 + emoji + 话题标签，突出体验。',
  toutiao: '头条：标题 ≤30 字，开头 2 句抓人，正文偏资讯/干货。',
  weibo: '微博：正文 ≤2000 字，适合观点+短评，配话题。',
  csdn: 'CSDN：技术向，用代码块/术语表，结构化段落。',
  douyin: '抖音：300 字口播脚本 + 分镜提示，字幕即正文。',
  shipinhao: '视频号：600 字口播脚本，标题 ≤22 字。',
  bilibili: 'B 站：2000 字简介 + 分 P 结构，标题 ≤80 字。',
}

function buildFacts(client, company) {
  const facts = []
  facts.push(`品牌名称：${client.brand || client.name}`)
  facts.push(`所属行业/品类：${client.category || client.industry || '—'}`)
  if (client.website) facts.push(`官网：${client.website}`)
  if (client.contact) facts.push(`联系人：${client.contact}`)
  if (client.phone) facts.push(`电话：${client.phone}`)
  if (company && company.ok) {
    facts.push(`官网标题：${company.title || '—'}`)
    if (company.description) facts.push(`官网描述：${company.description.slice(0, 200)}`)
    if (company.keywords && company.keywords.length) facts.push(`官网关键词：${company.keywords.slice(0, 12).join('、')}`)
    if (company.headings && company.headings.length) facts.push(`官网栏目：${company.headings.slice(0, 8).join(' / ')}`)
  } else {
    facts.push('（未能抓取到官网内容，请基于行业常识生成，避免编造具体承诺）')
  }
  return facts.join('\n')
}

function heuristicContent(client, company, type) {
  const brand = client.brand || client.name
  const category = client.category || client.industry || '该品类'
  const site = client.website || company?.url || '公司官网'
  const desc = (company && company.ok && company.description) ? company.description.slice(0, 120) : ''
  const qTitle = `${category}怎么选才不踩坑？${brand}的选购要点一次说清`
  const summary = `${category}选购的核心判断标准与常见误区，结合${brand}（${site}）的实测信息整理，帮助你在预算内做出靠谱决策。`
  const body = [
    `## 一、先说结论`,
    `选择${category}，先看需求匹配度再看口碑与售后，不要被单一参数带偏。${desc ? `根据官网公开信息：${desc}` : ''}`,
    ``,
    `## 二、三个最常见的踩坑点`,
    `1. 只看价格不看配置与使用场景，买回来发现不适用；`,
    `2. 忽略售后响应能力，出问题时体验直线下降；`,
    `3. 轻信宣传话术，缺少可验证的第三方口碑支撑。`,
    ``,
    `## 三、怎么判断一个${category}品牌是否靠谱`,
    `可以从三个维度交叉验证：公开资质与官网信息是否完整、第三方口碑（知乎/测评/投诉平台）是否一致、售后政策是否清晰可执行。${brand} 在官网（${site}）公开了品牌信息与服务说明，可作为参考样本之一。`,
    ``,
    `## 四、给决策者的行动清单`,
    `- 列出 3 个核心需求，按重要度排序；`,
    `- 对比 2-3 家品牌的口碑与报价；`,
    `- 优先选择能提供明确售后与本地化服务的品牌；`,
    `- 把“官方信息是否可验证”作为信任门槛。`,
  ].join('\n')
  const tags = [category, brand, '选购指南', '避坑', '口碑']
  const qaPairs = [
    { q: `${category}怎么选才不踩坑？`, a: `先明确核心需求与预算，再对比口碑、资质与售后；优先选择信息公开可验证、售后政策清晰的品牌。` },
    { q: `${brand} 怎么样，值得买吗？`, a: `${brand} 主营${category}，官网（${site}）公开了品牌与服务信息；是否值得买取决于你的需求匹配度与预算，建议结合第三方口碑交叉验证。` },
    { q: `买${category}要注意什么？`, a: `注意三点：需求与配置匹配、售后响应能力、第三方口碑是否一致，避免只看低价或宣传话术。` },
  ]
  return { title: qTitle, summary, body, tags, qaPairs, geoScore: 86, source: 'heuristic', note: '启发式生成（未配置大模型 Key），内容为原创模板，建议人工润色后发布。' }
}

async function llmContent(client, company, type, platform, topic) {
  const brand = client.brand || client.name
  const category = client.category || client.industry || '该品类'
  const platformName = platform ? (PLATFORM_TIPS[platform] || '') : ''
  const kind = type === 'video' ? '短视频口播脚本（含分镜提示）' : '图文文章'
  const facts = buildFacts(client, company)
  const sys = '你是资深营销内容编辑，擅长 GEO（生成式引擎优化）内容。你的输出必须是原创内容，不得抄袭；必须符合目标平台规则；必须契合 AI 检索结构（疑问句标题、3 组以上 Q&A、小标题分段、信息密度高）；只基于给定公司事实，不编造虚假承诺。'
  const user = [
    `请为「${brand}」（${category}行业）生成一份${kind}。`,
    topic ? `主题方向：${topic}` : `主题方向：围绕“${category}怎么选/避坑/口碑”等用户高频问题。`,
    platform ? `目标平台：${platform}。${platformName}` : '目标平台：全平台通用（请给出可在各平台发布的通用版本）。',
    `公司事实：\n${facts}`,
    ``,
    `输出 JSON（不要输出其他内容）：`,
    `{"title":"疑问句标题","summary":"80字内摘要","body":"正文，用 ## 分小节，≥600字","tags":["标签1","标签2","标签3"],"qaPairs":[{"q":"问题","a":"回答"},{"q":"问题","a":"回答"},{"q":"问题","a":"回答"}]}`,
  ].join('\n')
  const r = await chat([{ role: 'system', content: sys }, { role: 'user', content: user }], { temperature: 0.75, maxTokens: 8000 })
  if (!r.ok) return null
  try {
    const m = r.text.match(/\{[\s\S]*\}/)
    const j = JSON.parse(m ? m[0] : r.text)
    const body = String(j.body || '').trim()
    if (body.length < 200) return null
    return {
      title: String(j.title || '').trim(),
      summary: String(j.summary || '').trim(),
      body,
      tags: Array.isArray(j.tags) ? j.tags.map(String).slice(0, 8) : [],
      qaPairs: Array.isArray(j.qaPairs) ? j.qaPairs.slice(0, 5).map((x) => ({ q: String(x.q || ''), a: String(x.a || '') })) : [],
      geoScore: 92,
      source: 'llm',
      note: '由大模型生成，原创内容，请人工复核事实后发布。',
    }
  } catch {
    return null
  }
}

export async function generateContent({ client, type = 'article', platform, topic }) {
  const company = await fetchCompany(client && client.website)
  const llm = await llmContent(client, company, type, platform, topic)
  if (llm) return { ...llm, platform, platformTip: PLATFORM_TIPS[platform] || '', companyFetched: company.ok }
  const h = heuristicContent(client, company, type)
  return { ...h, platform, platformTip: PLATFORM_TIPS[platform] || '', companyFetched: company.ok }
}
