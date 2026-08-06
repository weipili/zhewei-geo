import { Link, useParams } from 'react-router-dom'
import { Icon } from '../ui/Icon'
import { BarRow, LineChart, RadarChart, ScoreDial, SentimentBar } from '../ui/Charts'
import { fmtDateTime, useStore } from '../core/store'

export default function ReportDetail() {
  const { id } = useParams()
  const { audits, clients } = useStore()
  const audit = audits.find((a) => a.id === id)

  if (!audit || !audit.result) {
    return (
      <div className="empty" style={{ paddingBlock: 'var(--s-9)' }}>
        <div className="empty-ico">
          <Icon name="report" size={22} />
        </div>
        <b style={{ fontSize: 'var(--t-md)', color: 'var(--ink)' }}>报告不存在或尚未生成完毕</b>
        <p style={{ fontSize: 'var(--t-sm)', maxWidth: '38ch', lineHeight: 1.7 }}>
          该报告可能已被删除，或检测过程被中断。你可以回到报告中心查看全部记录。
        </p>
        <Link to="/reports" className="btn btn-ghost" style={{ marginTop: 6 }}>
          返回报告中心
        </Link>
      </div>
    )
  }

  const r = audit.result
  const client = clients.find((c) => c.id === audit.clientId)
  const avgRate = r.mentions.reduce((s, m) => s + m.rate, 0) / Math.max(1, r.mentions.length)
  const best = [...r.mentions].sort((a, b) => b.rate - a.rate)[0]
  const worst = [...r.mentions].sort((a, b) => a.rate - b.rate)[0]

  const print = () => window.print()

  return (
    <div className="report">
      {/* ---- 报告头 ---- */}
      <div className="page-head">
        <div>
          <div className="row gap-3" style={{ marginBottom: 10 }}>
            <Link to="/reports" className="btn btn-quiet btn-sm no-print">
              <Icon name="chevronR" size={13} />
              <span style={{ transform: 'rotate(180deg)', display: 'inline-block' }}>返回</span>
            </Link>
            <span className="eyebrow">GEO 体检报告 · {fmtDateTime(audit.finishedAt)}</span>
          </div>
          <h1 className="page-title">{audit.brand}</h1>
          <p className="page-sub">
            {audit.category} · {client?.name ?? '未关联客户'} · 覆盖 {audit.platforms.length} 个 AI 平台
            {audit.website && ` · ${audit.website}`}
          </p>
        </div>
        <div className="row gap-2 no-print">
          <button className="btn btn-ghost" onClick={print}>
            <Icon name="download" size={15} />
            导出 PDF
          </button>
          <Link to="/audit" className="btn btn-primary">
            <Icon name="refresh" size={15} />
            重新体检
          </Link>
        </div>
      </div>

      {/* ---- 01 总览 ---- */}
      <section className="rpt-sec">
        <div className="rpt-num">01</div>
        <div className="rpt-body">
          <h2 className="rpt-title">总体结论</h2>

          <div className="grid" style={{ gridTemplateColumns: 'auto minmax(0,1fr)', gap: 'var(--s-6)', alignItems: 'center', marginBottom: 'var(--s-5)' }}>
            <ScoreDial score={r.aivo.total} size={196} />
            <div className="col gap-4" style={{ minWidth: 0 }}>
              <p style={{ fontSize: 'var(--t-md)', lineHeight: 1.85, color: 'var(--ink-2)' }}>{r.overview.summary}</p>
              <div className="grid g-4" style={{ gap: 'var(--s-2)' }}>
                {[
                  { l: '平均提及率', v: `${avgRate.toFixed(1)}%` },
                  { l: '最佳平台', v: best?.name ?? '—' },
                  { l: '最弱平台', v: worst?.name ?? '—' },
                  { l: '综合评级', v: r.aivo.grade },
                ].map((x) => (
                  <div key={x.l} className="col" style={{ gap: 4, padding: '10px 12px', background: 'var(--surface-2)', borderRadius: 'var(--r-sm)' }}>
                    <span className="eyebrow" style={{ fontSize: '0.58rem' }}>
                      {x.l}
                    </span>
                    <b style={{ fontSize: 'var(--t-sm)' }} className="truncate">
                      {x.v}
                    </b>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid g-2" style={{ gap: 'var(--s-4)' }}>
            <div className="callout" data-tone="ok">
              <div className="callout-h">
                <Icon name="check" size={15} />
                有利条件
              </div>
              <ul className="rpt-list">
                {r.overview.highlights.map((h, i) => (
                  <li key={i}>{h}</li>
                ))}
              </ul>
            </div>
            <div className="callout" data-tone="danger">
              <div className="callout-h">
                <Icon name="warn" size={15} />
                关键风险
              </div>
              <ul className="rpt-list">
                {r.overview.risks.map((h, i) => (
                  <li key={i}>{h}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ---- 02 AIVO ---- */}
      <section className="rpt-sec">
        <div className="rpt-num">02</div>
        <div className="rpt-body">
          <h2 className="rpt-title">AIVO 四维评分</h2>
          <p className="rpt-lead">四个维度等权重各占 25 分，加总为综合得分。≥90 优秀 · ≥75 良好 · ≥60 一般 · &lt;60 较差。</p>

          <div className="grid" style={{ gridTemplateColumns: 'auto minmax(0,1fr)', gap: 'var(--s-6)', alignItems: 'center' }}>
            <RadarChart
              size={262}
              axes={[
                { label: 'AI 可见性', value: r.aivo.visibility },
                { label: '基建完善度', value: r.aivo.infra },
                { label: '竞争优势', value: r.aivo.competition },
                { label: '舆情健康度', value: r.aivo.sentiment },
              ]}
            />
            <div className="col gap-3" style={{ minWidth: 0 }}>
              {[
                { l: 'AI 可见性', v: r.aivo.visibility, d: '品牌在 AI 回答中被提及的广度与频次' },
                { l: '基建完善度', v: r.aivo.infra, d: '官网结构化数据、自媒体矩阵、权威背书、百科问答四层地基' },
                { l: '竞争优势', v: r.aivo.competition, d: '相对同品类头部品牌的心智占位差距' },
                { l: '舆情健康度', v: r.aivo.sentiment, d: '正负面声量比例与负面话题集中度' },
              ].map((x) => (
                <div key={x.l} className="col" style={{ gap: 6, paddingBottom: 'var(--s-3)', borderBottom: '1px solid var(--line)' }}>
                  <div className="row-between">
                    <b style={{ fontSize: 'var(--t-sm)' }}>{x.l}</b>
                    <span className="num" style={{ fontSize: 'var(--t-md)', fontWeight: 600, color: x.v >= 75 ? 'var(--ok)' : x.v >= 60 ? 'var(--warn)' : 'var(--danger)' }}>
                      {x.v}
                    </span>
                  </div>
                  <div style={{ height: 5, background: 'var(--surface-2)', borderRadius: 99, overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${x.v}%`,
                        background: x.v >= 75 ? 'var(--ok)' : x.v >= 60 ? 'var(--warn)' : 'var(--danger)',
                        borderRadius: 99,
                        transition: 'width 1.2s cubic-bezier(0.16,1,0.3,1)',
                      }}
                    />
                  </div>
                  <span className="muted" style={{ fontSize: 'var(--t-2xs)', lineHeight: 1.6 }}>
                    {x.d}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 'var(--s-5)' }}>
            <div className="eyebrow" style={{ marginBottom: 'var(--s-3)' }}>
              AIVO 得分走势（近 6 期）
            </div>
            <LineChart labels={r.trend.map((t) => t.label)} series={[{ name: 'AIVO', color: 'var(--accent)', data: r.trend.map((t) => t.score) }]} height={170} suffix=" 分" />
          </div>
        </div>
      </section>

      {/* ---- 03 平台提及 ---- */}
      <section className="rpt-sec">
        <div className="rpt-num">03</div>
        <div className="rpt-body">
          <h2 className="rpt-title">各 AI 平台提及表现</h2>
          <p className="rpt-lead">
            向每个平台投放 {r.mentions[0]?.samples ?? 6} 组高意图问题，统计品牌被提及的比例与首位推荐次数。
            不同平台语料来源不同，提及率存在合理差异。
          </p>

          <div className="grid" style={{ gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 'var(--s-6)' }}>
            <div>
              <BarRow
                items={[...r.mentions]
                  .sort((a, b) => b.rate - a.rate)
                  .map((m) => ({
                    label: m.name,
                    value: m.rate,
                    color: m.rate >= avgRate ? 'var(--accent)' : 'var(--ink-4)',
                    sub: m.source === 'search' ? '实测' : '推演',
                  }))}
                max={Math.max(...r.mentions.map((m) => m.rate)) * 1.15}
              />
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="tbl">
                <thead>
                  <tr>
                    <th>平台</th>
                    <th style={{ textAlign: 'right' }}>提及率</th>
                    <th style={{ textAlign: 'right' }}>首推</th>
                    <th>来源</th>
                  </tr>
                </thead>
                <tbody>
                  {[...r.mentions]
                    .sort((a, b) => b.rate - a.rate)
                    .map((m) => (
                      <tr key={m.code}>
                        <td style={{ fontWeight: 500 }}>{m.name}</td>
                        <td style={{ textAlign: 'right' }} className="num">
                          {m.rate}%
                        </td>
                        <td style={{ textAlign: 'right' }} className="num muted">
                          {m.firstPlace}/{m.samples}
                        </td>
                        <td>
                          <span className={`tag ${m.source === 'search' ? 'tag-info' : 'tag-neutral'}`}>
                            {m.source === 'search' ? '实测' : '推演'}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ---- 04 用户画像 ---- */}
      <section className="rpt-sec">
        <div className="rpt-num">04</div>
        <div className="rpt-body">
          <h2 className="rpt-title">用户画像与搜索场景</h2>
          <p className="rpt-lead">{r.profile.persona}</p>
          <div className="grid g-2" style={{ gap: 'var(--s-5)' }}>
            <div>
              <div className="eyebrow" style={{ marginBottom: 'var(--s-3)' }}>
                典型决策场景
              </div>
              <div className="row wrap gap-2">
                {r.profile.scenarios.map((s, i) => (
                  <span key={i} className="tag tag-neutral" style={{ padding: '5px 10px', fontSize: 'var(--t-xs)' }}>
                    {s}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <div className="eyebrow" style={{ marginBottom: 'var(--s-3)' }}>
                本次测试投放的问题
              </div>
              <ol className="rpt-list rpt-list-num">
                {r.profile.questions.map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* ---- 05 基建 ---- */}
      <section className="rpt-sec">
        <div className="rpt-num">05</div>
        <div className="rpt-body">
          <h2 className="rpt-title">GEO 基建评估</h2>
          <p className="rpt-lead">四层地基决定 AI 能否找到并信任你的品牌事实。基建不牢，投再多内容也难被引用。</p>
          <div className="grid g-2" style={{ gap: 'var(--s-3)' }}>
            {r.infra.map((it) => (
              <div key={it.name} className="infra-card" data-status={it.status}>
                <div className="row-between" style={{ marginBottom: 9 }}>
                  <b style={{ fontSize: 'var(--t-sm)' }}>{it.name}</b>
                  <span className="num" style={{ fontSize: 'var(--t-sm)', fontWeight: 600 }}>
                    {it.score}
                    <span className="muted" style={{ fontSize: 'var(--t-2xs)' }}>/{it.max}</span>
                  </span>
                </div>
                <div style={{ height: 5, background: 'var(--surface-2)', borderRadius: 99, overflow: 'hidden', marginBottom: 10 }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${(it.score / it.max) * 100}%`,
                      background: it.status === 'ok' ? 'var(--ok)' : it.status === 'warn' ? 'var(--warn)' : 'var(--danger)',
                      borderRadius: 99,
                      transition: 'width 1.1s cubic-bezier(0.16,1,0.3,1)',
                    }}
                  />
                </div>
                <p className="muted" style={{ fontSize: 'var(--t-xs)', lineHeight: 1.7 }}>
                  {it.finding}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- 06 竞品对比矩阵 ---- */}
      <section className="rpt-sec">
        <div className="rpt-num">06</div>
        <div className="rpt-body">
          <h2 className="rpt-title">竞品对比矩阵</h2>
          <p className="rpt-lead">同品类品牌在 AI 可见性、基建、内容、舆情四个子维度的逐项对比，定位自身相对强弱。</p>
          <div style={{ overflowX: 'auto' }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>品牌</th>
                  <th style={{ textAlign: 'right' }}>可见性</th>
                  <th style={{ textAlign: 'right' }}>基建</th>
                  <th style={{ textAlign: 'right' }}>内容</th>
                  <th style={{ textAlign: 'right' }}>舆情</th>
                  <th style={{ textAlign: 'right' }}>提及率</th>
                  <th>强弱项</th>
                </tr>
              </thead>
              <tbody>
                {[...r.competitorMatrix]
                  .sort((a, b) => b.avgRate - a.avgRate)
                  .map((c) => (
                    <tr key={c.name} style={c.isSelf ? { background: 'var(--accent-soft)' } : undefined}>
                      <td style={{ fontWeight: 600 }}>
                        {c.name}
                        {c.isSelf && (
                          <span className="tag tag-accent" style={{ fontSize: '0.56rem', marginLeft: 6 }}>
                            本品牌
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }} className="num">
                        {c.visibility}
                      </td>
                      <td style={{ textAlign: 'right' }} className="num">
                        {c.infra}
                      </td>
                      <td style={{ textAlign: 'right' }} className="num">
                        {c.content}
                      </td>
                      <td style={{ textAlign: 'right' }} className="num">
                        {c.sentiment}
                      </td>
                      <td style={{ textAlign: 'right' }} className="num">
                        {c.avgRate}%
                      </td>
                      <td style={{ fontSize: 'var(--t-2xs)', color: 'var(--ink-3)' }}>
                        <span style={{ color: 'var(--ok)' }}>优：</span>
                        {c.strength} · <span style={{ color: 'var(--danger)' }}>弱：</span>
                        {c.weakness}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ---- 07 行业横评 ---- */}
      <section className="rpt-sec">
        <div className="rpt-num">07</div>
        <div className="rpt-body">
          <h2 className="rpt-title">行业横评</h2>
          <p className="rpt-lead">
            同行业标杆品牌的市场份额对标（行业基准均值为 {r.industryBenchmark}%）。定位本品牌在行业中的真实占位。
            {r.industry[0]?.source && r.industry[0].source !== '推演' ? ` 数据来源：${r.industry[0].source} 等公开报告。` : ''}
          </p>
          <div style={{ overflowX: 'auto' }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>品牌</th>
                  <th style={{ textAlign: 'right' }}>市场份额</th>
                  <th>说明</th>
                </tr>
              </thead>
              <tbody>
                {r.industry.map((p) => (
                  <tr key={p.name} style={p.isSelf ? { background: 'var(--accent-soft)' } : undefined}>
                    <td style={{ fontWeight: 600 }}>
                      {p.name}
                      {p.isSelf && (
                        <span className="tag tag-accent" style={{ fontSize: '0.56rem', marginLeft: 6 }}>
                          本品牌
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }} className="num">
                      {p.share}%
                    </td>
                    <td style={{ fontSize: 'var(--t-2xs)', color: 'var(--ink-3)' }}>{p.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ---- 08 得失分 ---- */}
      <section className="rpt-sec">
        <div className="rpt-num">08</div>
        <div className="rpt-body">
          <h2 className="rpt-title">得失分归因</h2>
          <p className="rpt-lead">各 GEO 要素相对行业基准对本品牌综合评分的拉动与拖累（正=加分，负=扣分）。</p>
          <div className="col gap-3">
            {r.gainLoss.map((g, i) => (
              <div key={i} className="row gap-3" style={{ alignItems: 'stretch' }}>
                <span className="tag" style={{ fontSize: '0.6rem', alignSelf: 'flex-start', background: g.status === 'gain' ? 'color-mix(in oklch,var(--ok) 18%,transparent)' : g.status === 'loss' ? 'color-mix(in oklch,var(--danger) 16%,transparent)' : 'var(--surface-2)', color: g.status === 'gain' ? 'var(--ok)' : g.status === 'loss' ? 'var(--danger)' : 'var(--ink-3)' }}>
                  {g.status === 'gain' ? '加分' : g.status === 'loss' ? '扣分' : '持平'}
                </span>
                <div className="col grow" style={{ gap: 5, minWidth: 0 }}>
                  <div className="row-between">
                    <b style={{ fontSize: 'var(--t-sm)' }}>{g.factor}</b>
                    <span className="num" style={{ fontSize: 'var(--t-sm)', fontWeight: 600, color: g.gain > 0 ? 'var(--ok)' : g.gain < 0 ? 'var(--danger)' : 'var(--ink-3)' }}>
                      {g.gain > 0 ? '+' : ''}
                      {g.gain}
                    </span>
                  </div>
                  <div style={{ height: 5, background: 'var(--surface-2)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.min(100, Math.abs(g.gain) * 4)}%`, background: g.gain > 0 ? 'var(--ok)' : g.gain < 0 ? 'var(--danger)' : 'var(--ink-4)', borderRadius: 99, transition: 'width 1s var(--e-out)' }} />
                  </div>
                  <span className="muted" style={{ fontSize: 'var(--t-2xs)' }}>{g.note}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- 09 生态布局（联网搜） ---- */}
      <section className="rpt-sec">
        <div className="rpt-num">09</div>
        <div className="rpt-body">
          <h2 className="rpt-title">现有生态布局</h2>
          <div className="row gap-2" style={{ marginBottom: 'var(--s-3)' }}>
            <span className={`tag ${r.eco.mode === 'live' ? 'tag-ok' : 'tag-neutral'}`} style={{ fontSize: '0.58rem' }}>
              {r.eco.mode === 'live' ? '真实联网检索' : '模拟推演'}
            </span>
            <span className="tag tag-accent" style={{ fontSize: '0.58rem' }}>
              生态健康度 {r.eco.health}
            </span>
          </div>
          <p className="rpt-lead">{r.eco.summary}</p>
          <div className="grid g-2" style={{ gap: 'var(--s-3)' }}>
            {r.eco.items.map((it, i) => (
              <div key={i} className="panel col gap-2" style={{ padding: 'var(--s-3)', borderRadius: 'var(--r-sm)' }}>
                <div className="row-between">
                  <b style={{ fontSize: 'var(--t-xs)' }}>{it.platform}</b>
                  <span className={`tag ${it.cited ? 'tag-ok' : 'tag-neutral'}`} style={{ fontSize: '0.56rem' }}>
                    {it.cited ? '被 AI 引用' : '未引用'}
                  </span>
                </div>
                <span className="muted" style={{ fontSize: 'var(--t-2xs)', lineHeight: 1.6 }}>{it.title}</span>
                <div className="row-between">
                  <span className="tag tag-neutral" style={{ fontSize: '0.54rem' }}>{it.kind}</span>
                  <span className="muted" style={{ fontSize: '0.6rem' }}>
                    覆盖 <b className="num">{it.reach}</b> · 情感{' '}
                    <b style={{ color: it.sentiment === 'pos' ? 'var(--ok)' : it.sentiment === 'neg' ? 'var(--danger)' : 'var(--ink-3)' }}>{it.sentiment === 'pos' ? '正' : it.sentiment === 'neg' ? '负' : '中'}</b>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- 10 GEO 要素占比 ---- */}
      <section className="rpt-sec">
        <div className="rpt-num">10</div>
        <div className="rpt-body">
          <h2 className="rpt-title">GEO 要素分析占比</h2>
          <p className="rpt-lead">行业研究框架下的 GEO 要素基准权重，以及本品牌当前在各要素上的表现（0-100）。</p>
          <div className="col gap-4">
            {r.geoFactors.map((f) => (
              <div key={f.key} className="col gap-2">
                <div className="row-between">
                  <b style={{ fontSize: 'var(--t-sm)' }}>{f.label}</b>
                  <span className="muted" style={{ fontSize: 'var(--t-2xs)' }}>
                    权重 <b className="num" style={{ color: 'var(--accent)' }}>{f.weight}%</b> · 表现 <b className="num">{f.score}</b>
                  </span>
                </div>
                <div style={{ height: 6, background: 'var(--surface-2)', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${f.score}%`, background: f.score >= 70 ? 'var(--ok)' : f.score >= 50 ? 'var(--warn)' : 'var(--danger)', borderRadius: 99, transition: 'width 1s var(--e-out)' }} />
                </div>
                <span className="muted" style={{ fontSize: 'var(--t-2xs)', lineHeight: 1.6 }}>{f.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- 11 蒸馏词 ---- */}
      <section className="rpt-sec">
        <div className="rpt-num">11</div>
        <div className="rpt-body">
          <h2 className="rpt-title">蒸馏词</h2>
          <p className="rpt-lead">被 AI 高频引用的核心语义锚点。围绕这些词构建「品牌+场景」语义组合，可显著提升被推荐概率。</p>
          <div className="row wrap" style={{ gap: 10 }}>
            {r.distill.map((d, i) => (
              <span key={i} className="topic-chip" data-tone="pos" style={{ fontSize: `${0.78 + (d.weight / 100) * 0.5}rem` }} title={d.why}>
                {d.word}
                <b className="num" style={{ opacity: 0.5, fontSize: '0.7em', marginLeft: 5 }}>
                  {d.weight}
                </b>
              </span>
            ))}
          </div>
          <div className="col gap-2" style={{ marginTop: 'var(--s-4)' }}>
            {r.distill.map((d, i) => (
              <p key={i} className="muted" style={{ fontSize: 'var(--t-2xs)', lineHeight: 1.6 }}>
                <b style={{ color: 'var(--ink-2)' }}>{d.word}</b>：{d.why}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* ---- 12 长尾词推荐 ---- */}
      <section className="rpt-sec">
        <div className="rpt-num">12</div>
        <div className="rpt-body">
          <h2 className="rpt-title">长尾词推荐</h2>
          <p className="rpt-lead">用户向 AI 提问的高意图长尾问题。优先覆盖低热度、低竞争的词，性价比最高。</p>
          <div style={{ overflowX: 'auto' }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>长尾问题</th>
                  <th>意图</th>
                  <th style={{ textAlign: 'right' }}>热度</th>
                  <th style={{ textAlign: 'right' }}>竞争度</th>
                  <th>来源</th>
                </tr>
              </thead>
              <tbody>
                {r.longTail.map((t, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 500 }}>{t.q}</td>
                    <td style={{ fontSize: 'var(--t-2xs)' }}>{t.intent}</td>
                    <td style={{ textAlign: 'right' }} className="num">
                      {t.volume}
                    </td>
                    <td
                      className="num"
                      style={{ textAlign: 'right', color: t.difficulty > 50 ? 'var(--warn)' : 'var(--ink-3)' }}
                    >
                      {t.difficulty}
                    </td>
                    <td>
                      <span className={`tag ${t.source === 'live' ? 'tag-ok' : 'tag-neutral'}`} style={{ fontSize: '0.56rem' }}>
                        {t.source === 'live' ? '真实' : '推演'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ---- 13 舆情 ---- */}
      <section className="rpt-sec">
        <div className="rpt-num">13</div>
        <div className="rpt-body">
          <h2 className="rpt-title">舆情健康度</h2>
          <p className="rpt-lead">AI 回答中围绕品牌出现的情感倾向与高频话题。负面词会直接压低 AI 的推荐意愿。</p>
          <div className="grid" style={{ gridTemplateColumns: 'minmax(0,0.9fr) minmax(0,1.1fr)', gap: 'var(--s-6)' }}>
            <div className="col gap-5">
              <SentimentBar positive={r.sentiment.positive} neutral={r.sentiment.neutral} negative={r.sentiment.negative} />
              <div className="callout" data-tone={r.sentiment.negative > 15 ? 'warn' : 'ok'}>
                <div className="callout-h">
                  <Icon name={r.sentiment.negative > 15 ? 'warn' : 'shield'} size={15} />
                  {r.sentiment.negative > 15 ? '负面声量需要干预' : '舆情基本盘健康'}
                </div>
                <p style={{ fontSize: 'var(--t-xs)', lineHeight: 1.75 }}>
                  {r.sentiment.negative > 15
                    ? `负面占比 ${r.sentiment.negative}% 已超过 15% 警戒线，建议针对高热负面词产出正向解释内容，主动稀释。`
                    : `负面占比 ${r.sentiment.negative}% 在安全区间内，可将舆情优势转化为内容素材，放大正面话题。`}
                </p>
              </div>
            </div>
            <div>
              <div className="eyebrow" style={{ marginBottom: 'var(--s-3)' }}>
                高频话题词
              </div>
              <div className="row wrap" style={{ gap: 9 }}>
                {r.sentiment.topics.map((t) => (
                  <span
                    key={t.word}
                    className="topic-chip"
                    data-tone={t.tone}
                    style={{ fontSize: `${0.72 + (t.heat / 100) * 0.34}rem` }}
                  >
                    {t.word}
                    <b className="num" style={{ opacity: 0.55, fontSize: '0.72em', marginLeft: 5 }}>
                      {t.heat}
                    </b>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---- 08 建议 ---- */}
      <section className="rpt-sec">
        <div className="rpt-num">08</div>
        <div className="rpt-body">
          <h2 className="rpt-title">行动建议</h2>
          <p className="rpt-lead">按优先级排序。P0 是当前最该做的事，做完再看 P1。每条都标注了投入与预期影响。</p>
          <div className="col gap-3">
            {r.suggestions.map((s, i) => (
              <div key={i} className="sug" data-p={s.priority}>
                <div className="sug-p">{s.priority}</div>
                <div className="col grow" style={{ gap: 7, minWidth: 0 }}>
                  <div className="row-between wrap" style={{ gap: 'var(--s-3)' }}>
                    <b style={{ fontSize: 'var(--t-md)' }}>{s.title}</b>
                    <div className="row gap-2">
                      <span className="tag tag-neutral">投入 {s.effort}</span>
                      <span className={`tag ${s.impact === '高' ? 'tag-ok' : 'tag-neutral'}`}>影响 {s.impact}</span>
                      <span className="tag tag-accent">{s.owner}</span>
                    </div>
                  </div>
                  <p style={{ fontSize: 'var(--t-sm)', lineHeight: 1.8, color: 'var(--ink-2)' }}>{s.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- 免责 ---- */}
      <div className="disclaimer">
        <div className="sprockets" style={{ marginBottom: 12 }}>
          {Array.from({ length: 14 }, (_, i) => (
            <i key={i} />
          ))}
        </div>
        <p>
          <b>数据说明：</b>标注「实测」的数据来自真实检索结果；标注「推演」的数据由模型基于品牌特征推算，用于趋势参考。
          本报告用于诊断品牌在生成式 AI 中的可见度现状并提供优化方向，
          <b>不构成对排名、流量、客流或收益的任何承诺与保证</b>。
          GEO 优化效果受平台算法调整、行业竞争强度、执行质量等多重因素影响，实际结果可能与预期存在差异。
        </p>
        <p style={{ marginTop: 10 }}>
          报告生成时间：{fmtDateTime(audit.finishedAt)} · 显影 GEO 交付中台 · 报告编号 {audit.id}
        </p>
      </div>
    </div>
  )
}
