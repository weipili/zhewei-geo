/* ============================================================
   哲唯科技~GEO交付平台 · 官网落地页
   独立于工作台的公开首页：品牌叙事 + 能力矩阵 + 真实产出展示
   ============================================================ */
import { Link } from 'react-router-dom'

const FEATURES = [
  { n: '01', t: '工作台看板', d: '曝光 / 互动 / 关注 KPI、渠道构成、GEO 可见度评分，全局一目了然。', i: '📊' },
  { n: '02', t: 'GEO 体检', d: '真实联网分析：生态布局、行业横评、长尾词、官网抓取、大模型实测，一键生成报告。', i: '🔍' },
  { n: '03', t: '报告中心', d: '编辑部风格 GEO 报告，8 大章节 + 合规免责声明，可直接导出交付客户。', i: '📄' },
  { n: '04', t: '内容中台 · AI 生成', d: '基于公司事实自动生成原创文章 / 口播稿，符合各平台规则，契合 AI 检索结构。', i: '✨' },
  { n: '05', t: '多平台分发', d: '公众号 / 知乎 / 百家号 / 小红书 / 头条 / 微博 / CSDN / 抖音 / 视频号 / B 站，一键分发。', i: '📡' },
  { n: '06', t: '渠道管理', d: '平台授权（OAuth / API Key）、健康度监控、凭证管理，10 平台统一管理。', i: '🔌' },
  { n: '07', t: '发布队列', d: '分发状态追踪、失败重试、定时发布，发布链路全程可查。', i: '🗂️' },
  { n: '08', t: '真实数据引擎', d: '联网实时爬取品牌全网露出，DeepSeek 大模型实测 AI 提及率，数据可溯源。', i: '🧠' },
]

const STEPS = [
  { n: '01', t: '添加客户档案', d: '录入品牌、行业、官网，系统自动抓取官网信息作为事实锚点。' },
  { n: '02', t: 'AI 生成内容', d: '一键生成原创、平台合规、GEO 结构化（疑问句标题 + 问答对）的内容。' },
  { n: '03', t: '体检 + 分发', d: '实时体检品牌在 AI 回答中的可见度，并把内容分发到 10 个平台。' },
]

const PROOF_ITEMS = [
  { tag: '真实爬取', title: '12 个全网露出节点 · 提及率 18%', desc: 'GEO 体检实测：品牌在搜索引擎与大模型回答中的露出情况，数据来源「实测」。' },
  { tag: 'AI 原创', title: '电脑采购怎么选才不踩坑？', desc: 'DeepSeek 自动生成，融入公司事实，配 3 组以上 Q&A，知乎/公众号体一键适配。' },
  { tag: '端口绑定', title: 'API 8787 + 10 个分发端口', desc: '后端启动即绑定主 API 与 10 个分发平台服务端口，健康检查全绿。' },
]

export default function Landing() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--ink)', fontFamily: 'var(--font-sans)' }}>
      <style>{`
        .landing { max-width: 1120px; margin: 0 auto; padding: 0 24px; }
        .l-nav { display: flex; align-items: center; justify-content: space-between; padding: 22px 0; border-bottom: 1px solid var(--line); }
        .l-hero { padding: 84px 0 40px; }
        .l-title { font-family: var(--font-display); font-size: clamp(2.6rem, 2rem + 3vw, 4.2rem); line-height: 1.05; letter-spacing: -0.02em; max-width: 18ch; }
        .l-sub { font-size: var(--t-md); color: var(--ink-2); line-height: 1.9; max-width: 60ch; margin: 22px 0 30px; }
        .l-btn { display: inline-flex; align-items: center; gap: 8px; padding: 12px 22px; border-radius: var(--r-sm); font-weight: 600; text-decoration: none; }
        .l-btn-primary { background: var(--accent); color: var(--on-accent); }
        .l-btn-ghost { border: 1px solid var(--line-strong); color: var(--ink-2); }
        .l-stats { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 40px; }
        .l-stat { padding: 12px 18px; border: 1px solid var(--line); border-radius: var(--r-sm); background: var(--surface); }
        .l-sec { padding: 70px 0; border-top: 1px solid var(--line); }
        .l-eyebrow { font-family: var(--font-mono); font-size: var(--t-2xs); letter-spacing: 0.18em; color: var(--accent-ink); text-transform: uppercase; }
        .l-h2 { font-family: var(--font-display); font-size: clamp(1.9rem, 1.5rem + 1.6vw, 2.8rem); margin: 10px 0 34px; letter-spacing: -0.01em; }
        .l-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px; }
        .l-card { padding: 22px; border: 1px solid var(--line); border-radius: var(--r-sm); background: var(--surface); transition: border-color 0.18s ease, transform 0.18s ease; }
        .l-card:hover { border-color: var(--line-strong); transform: translateY(-2px); }
        .l-card-i { font-size: 1.5rem; }
        .l-card-n { font-family: var(--font-mono); font-size: var(--t-2xs); color: var(--ink-4); }
        .l-card-t { font-size: var(--t-base); font-weight: 600; margin: 8px 0 6px; }
        .l-card-d { font-size: var(--t-xs); color: var(--ink-3); line-height: 1.7; }
        .l-steps { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; }
        .l-step { padding: 22px; border: 1px solid var(--line); border-radius: var(--r-sm); background: var(--surface-2); }
        .l-step-n { font-family: var(--font-mono); font-size: var(--t-xs); color: var(--accent-ink); }
        .l-proof { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; }
        .l-proof-card { padding: 24px; border: 1px solid var(--line); border-radius: var(--r-sm); background: var(--surface); border-top: 2.5px solid var(--accent); }
        .l-cta { padding: 70px 0 90px; border-top: 1px solid var(--line); text-align: center; }
        .l-footer { padding: 26px 0 40px; border-top: 1px solid var(--line); font-size: var(--t-2xs); color: var(--ink-3); display: flex; justify-content: space-between; flex-wrap: wrap; gap: 10px; }
        @media (max-width: 640px) { .l-hero { padding: 50px 0 26px; } .l-nav { flex-direction: column; gap: 12px; align-items: flex-start; } }
      `}</style>

      {/* 顶部导航 */}
      <div className="landing">
        <nav className="l-nav">
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', lineHeight: 1 }}>哲唯科技</div>
            <div className="l-eyebrow" style={{ fontSize: '0.6rem' }}>GEO 交付平台</div>
          </div>
          <Link to="/app" className="l-btn l-btn-primary">进入工作台 →</Link>
        </nav>
      </div>

      {/* Hero */}
      <div className="landing">
        <section className="l-hero">
          <div className="l-eyebrow">Generative Engine Optimization · GEO</div>
          <h1 className="l-title">把品牌在 AI 回答里的存在感，显影出来。</h1>
          <p className="l-sub">
            当用户开始向 DeepSeek、豆包、文心一言提问，你的品牌是否出现在回答里？
            哲唯科技 GEO 交付平台：真实联网爬取 + 大模型实测，帮企业看清在 AI 世界的可见度，
            并用 AI 原创内容 + 多平台分发，把「被引用」变成可运营的增长动作。
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link to="/app" className="l-btn l-btn-primary">🚀 免费体验工作台</Link>
            <a href="#capability" className="l-btn l-btn-ghost">查看能力</a>
          </div>
          <div className="l-stats">
            <div className="l-stat"><b className="num" style={{ fontSize: '1.3rem' }}>8</b><span style={{ marginLeft: 8, color: 'var(--ink-3)', fontSize: 'var(--t-xs)' }}>大功能模块</span></div>
            <div className="l-stat"><b className="num" style={{ fontSize: '1.3rem' }}>10</b><span style={{ marginLeft: 8, color: 'var(--ink-3)', fontSize: 'var(--t-xs)' }}>分发平台</span></div>
            <div className="l-stat"><b className="num" style={{ fontSize: '1.3rem' }}>实时</b><span style={{ marginLeft: 8, color: 'var(--ink-3)', fontSize: 'var(--t-xs)' }}>联网爬取 + 大模型实测</span></div>
            <div className="l-stat"><b className="num" style={{ fontSize: '1.3rem' }}>100%</b><span style={{ marginLeft: 8, color: 'var(--ink-3)', fontSize: 'var(--t-xs)' }}>AI 原创内容</span></div>
          </div>
        </section>
      </div>

      {/* 能力矩阵 */}
      <div className="landing" id="capability">
        <section className="l-sec">
          <div className="l-eyebrow">Capabilities</div>
          <h2 className="l-h2">一个平台，管好品牌的「AI 存在感」</h2>
          <div className="l-grid">
            {FEATURES.map((f) => (
              <div key={f.n} className="l-card">
                <span className="l-card-i">{f.i}</span>
                <div className="l-card-n">{f.n}</div>
                <div className="l-card-t">{f.t}</div>
                <div className="l-card-d">{f.d}</div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* 三步使用 */}
      <div className="landing">
        <section className="l-sec">
          <div className="l-eyebrow">How it works</div>
          <h2 className="l-h2">三步，让品牌被 AI 看见</h2>
          <div className="l-steps">
            {STEPS.map((s) => (
              <div key={s.n} className="l-step">
                <div className="l-step-n">{s.n}</div>
                <div style={{ fontWeight: 600, margin: '6px 0' }}>{s.t}</div>
                <div style={{ fontSize: 'var(--t-xs)', color: 'var(--ink-3)', lineHeight: 1.7 }}>{s.d}</div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* 真实产出 */}
      <div className="landing">
        <section className="l-sec">
          <div className="l-eyebrow">Real outputs</div>
          <h2 className="l-h2">平台的真实产出</h2>
          <div className="l-proof">
            {PROOF_ITEMS.map((p) => (
              <div key={p.tag} className="l-proof-card">
                <span className="tag tag-accent" style={{ fontSize: '0.6rem' }}>{p.tag}</span>
                <div style={{ fontWeight: 600, margin: '8px 0 6px' }}>{p.title}</div>
                <div style={{ fontSize: 'var(--t-xs)', color: 'var(--ink-3)', lineHeight: 1.7 }}>{p.desc}</div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* CTA */}
      <div className="landing">
        <section className="l-cta">
          <h2 className="l-h2" style={{ marginBottom: 14 }}>现在就看看你的品牌，在 AI 眼里长什么样</h2>
          <p style={{ color: 'var(--ink-2)', fontSize: 'var(--t-sm)', marginBottom: 26 }}>
            进入工作台，发起一次真实联网 GEO 体检。
          </p>
          <Link to="/app" className="l-btn l-btn-primary" style={{ fontSize: '1rem', padding: '14px 30px' }}>进入工作台 →</Link>
        </section>
      </div>

      {/* 页脚 */}
      <div className="landing">
        <footer className="l-footer">
          <span>哲唯科技~GEO交付平台</span>
          <span>把品牌在 AI 回答里的存在感，显影出来。</span>
        </footer>
      </div>
    </div>
  )
}
