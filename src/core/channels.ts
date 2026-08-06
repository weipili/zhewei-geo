import type { ChannelDef } from './types'

/**
 * 平台能力矩阵。
 * geoWeight = 该平台内容被主流中文大模型抓取/引用的相对权重（0-100），
 * 依据：知乎/公众号/百家号在中文语料中被引用频次显著高于短视频平台。
 */
export const CHANNELS: ChannelDef[] = [
  {
    code: 'wechat',
    name: '微信公众号',
    kind: 'article',
    hue: '#07C160',
    bodyLimit: 20000,
    titleLimit: 64,
    caps: { cover: true, tags: false, schedule: true, geoWeight: 88 },
    tip: '权威性高，被元宝/豆包引用率领先，适合承载深度内容',
  },
  {
    code: 'zhihu',
    name: '知乎',
    kind: 'article',
    hue: '#0084FF',
    bodyLimit: 50000,
    titleLimit: 100,
    caps: { cover: true, tags: true, schedule: true, geoWeight: 95 },
    tip: 'GEO 首选。问答结构天然契合 AI 检索，务必配 Q&A 段落',
  },
  {
    code: 'baijia',
    name: '百家号',
    kind: 'both',
    hue: '#2932E1',
    bodyLimit: 20000,
    titleLimit: 40,
    caps: { cover: true, tags: true, schedule: true, geoWeight: 92 },
    tip: '文心一言语料直接来源，做百度系 GEO 必投',
  },
  {
    code: 'xiaohongshu',
    name: '小红书',
    kind: 'both',
    hue: '#FF2442',
    bodyLimit: 1000,
    titleLimit: 20,
    caps: { cover: true, tags: true, schedule: true, geoWeight: 71 },
    tip: '正文 1000 字上限，自动裁剪为精华版 + 话题标签',
  },
  {
    code: 'toutiao',
    name: '今日头条',
    kind: 'both',
    hue: '#FF6600',
    bodyLimit: 20000,
    titleLimit: 30,
    caps: { cover: true, tags: true, schedule: true, geoWeight: 84 },
    tip: '豆包语料上游，标题需在 30 字内',
  },
  {
    code: 'weibo',
    name: '微博',
    kind: 'both',
    hue: '#E6162D',
    bodyLimit: 2000,
    titleLimit: 0,
    caps: { cover: true, tags: true, schedule: true, geoWeight: 63 },
    tip: '舆情面必备，负面监测的主要战场',
  },
  {
    code: 'csdn',
    name: 'CSDN',
    kind: 'article',
    hue: '#FC5531',
    bodyLimit: 50000,
    titleLimit: 80,
    caps: { cover: true, tags: true, schedule: true, geoWeight: 79 },
    tip: '技术类品牌专用，代码块与技术词条易被引用',
  },
  {
    code: 'douyin',
    name: '抖音',
    kind: 'video',
    hue: '#000000',
    bodyLimit: 300,
    titleLimit: 55,
    caps: { cover: true, tags: true, schedule: true, geoWeight: 58 },
    tip: '视频文案即字幕，AI 主要抓取标题与话题',
  },
  {
    code: 'shipinhao',
    name: '视频号',
    kind: 'video',
    hue: '#FA9D3B',
    bodyLimit: 600,
    titleLimit: 22,
    caps: { cover: true, tags: true, schedule: true, geoWeight: 61 },
    tip: '与公众号联动可放大权重',
  },
  {
    code: 'bilibili',
    name: '哔哩哔哩',
    kind: 'video',
    hue: '#FB7299',
    bodyLimit: 2000,
    titleLimit: 80,
    caps: { cover: true, tags: true, schedule: true, geoWeight: 74 },
    tip: '简介栏可放长文本，是视频平台里 GEO 价值最高的',
  },
]

export const channelOf = (code: string) => CHANNELS.find((c) => c.code === code)
export const channelName = (code: string) => channelOf(code)?.name ?? code
