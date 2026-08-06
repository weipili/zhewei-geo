import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../ui/Icon'
import { BarRow, Counter, LineChart, ScoreDial, Spark, StackBars } from '../ui/Charts'
import { CHANNELS, channelName } from '../core/channels'
import { fmtNum, relTime, useStore } from '../core/store'

type Range = 7 | 14 | 30

export default function Dashboard() {
  const { activeClient, activeClientId, metrics, contents, audits, accounts, alerts } = useStore()
  const [range, setRange] = useState<Range>(14)

  const myContents = contents.filter((c) => c.clientId === activeClientId)
  const myAudits = audits.filter((a) => a.clientId === activeClientId && a.phase === 'done')
  const latestAudit = myAudits[0]
  const myAccounts = accounts.filter((a) => a.clientId === activeClientId)
  const connected = myAccounts.filter((a) => a.connected)

  /* ---- 指标聚合 ---- */
  const agg = useMemo(() => {
    const dates = Array.from(new Set(metrics.map((m) => m.date)))
    const window = dates.slice(-range)
    const prevWindow = dates.slice(-range * 2, -range)

    const sumIn = (ds: string[], key: 'views' | 'likes' | 'comments' | 'newFollowers') =>
      metrics.filter((m) => ds.includes(m.date)).reduce((s, m) => s + m[key], 0)

    const byDate = (key: 'views' | 'likes' | 'comments' | 'newFollowers') =>
      window.map((d) => metrics.filter((m) => m.date === d).reduce((s, m) => s + m[key], 0))

    const activeCh = Array.from(new Set(metrics.map((m) => m.channel)))
    const byChannel = activeCh
      .map((ch) => ({
        ch,
        views: metrics.filter((m) => m.channel === ch && window.includes(m.date)).reduce((s, m) => s + m.views, 0),
        series: window.map((d) => metrics.find((m) => m.date === d && m.channel === ch)?.views ?? 0),
      }))
      .sort((a, b) => b.views - a.views)

    const delta = (k: 'views' | 'likes' | 'comments' | 'newFollowers') => {
      const cur = sumIn(window, k)
      const prev = sumIn(prevWindow, k)
      return prev === 0 ? 0 : ((cur - prev) / prev) * 100
    }

    return {
      labels: window,
      views: sumIn(window, 'views'),
      likes: sumIn(window, 'likes'),
      comments: sumIn(window, 'comments'),
      followers: sumIn(window, 'newFollowers'),
      dViews: delta('views'),
      dLikes: delta('likes'),
      dFollowers: delta('newFollowers'),
      viewSeries: byDate('views'),
      engageSeries: byDate('likes'),
      byChannel,
    }
  }, [metrics, range])

  const published = myContents.filter((c) => c.status === 'published').length
  const queued = myContents.filter((c) => c.status === 'queued').length
  const failedTargets = myContents.flatMap((c) => c.targets).filter((t) => t.status === 'failed').length
  const unread = alerts.filter((a) => !a.read)

  const kpis = [
    { label: '总曝光', val: agg.views, d: agg.dViews, spark: agg.viewSeries, icon: 'trend' as const },
    { label: '互动量', val: agg.likes + agg.comments, d: agg.dLikes, spark: agg.engageSeries, icon: 'sparkle' as const },
    { label: '新增关注', val: agg.followers, d: agg.dFollowers, spark: null, icon: 'users' as const },
    { label: '已发布内容', val: published, d: null, spark: null, icon: 'doc' as const },
  ]

  const topStacks = agg.byChannel.slice(0, 4).map((c, i) => ({
    name: channelName(c.ch),
    color: ['var(--accent)', 'oklch(58% 0.13 205)', 'oklch(62% 0.14 145)', 'oklch(66% 0.13 78)'][i],
    data: c.series,
  }))

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow" style={{ marginBottom: 9 }}>
            工作台 · {activeClient?.brand}
          </div>
          <h1 className="page-title">今天该做什么</h1>
          <p className="page-sub">
            聚合 GEO 可见度、全渠道运营数据与发布状态。左侧是结论，右侧是待办——不用翻页找信息。
          </p>
        </div>
        <div className="row gap-2">
          <div
            className="row"
            style={{ gap: 2, padding: 2.5, background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 'var(--r-sm)' }}
          >
            {([7, 14, 30] as Range[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className="mono"
                style={{
                  padding: '4px 11px',
                  borderRadius: 4,
                  fontSize: 'var(--t-2xs)',
                  fontWeight: 500,
                  color: range === r ? 'var(--on-accent)' : 'var(--ink-3)',
                  background: range === r ? 'var(--accent)' : 'transparent',
                  transition: 'all var(--d-fast) var(--e-out)',
                }}
              >
                {r}天
              </button>
            ))}
          </div>
          <Link to="/audit" className="btn btn-primary">
            <Icon name="radar" size={15} />
            发起体检
          </Link>
        </div>
      </div>

      {/* KPI 条 */}
      <div className="kpi-strip rise" style={{ marginBottom: 'var(--s-5)' }}>
        {kpis.map((k) => (
          <div className="kpi" key={k.label}>
            <div className="row-between">
              <span className="eyebrow">{k.label}</span>
              <span style={{ color: 'var(--ink-4)', display: 'flex' }}>
                <Icon name={k.icon} size={14} />
              </span>
            </div>
            <div className="kpi-val">
              <Counter value={k.val} />
            </div>
            <div className="row-between">
              {k.d !== null ? (
                <span className="kpi-delta" style={{ color: k.d >= 0 ? 'var(--ok)' : 'var(--danger)' }}>
                  <Icon name={k.d >= 0 ? 'arrowUp' : 'arrowDown'} size={11} />
                  {Math.abs(k.d).toFixed(1)}% <span className="muted">环比</span>
                </span>
              ) : (
                <span className="kpi-delta muted">共 {myContents.length} 篇在库</span>
              )}
              {k.spark && <Spark data={k.spark} color={k.d && k.d >= 0 ? 'var(--ok)' : 'var(--accent)'} />}
            </div>
          </div>
        ))}
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'minmax(0,1.62fr) minmax(0,1fr)', gap: 'var(--s-4)' }}>
        {/* ===== 左列 ===== */}
        <div className="col gap-4" style={{ minWidth: 0 }}>
          {/* 曝光趋势 */}
          <section className="panel">
            <div className="panel-head">
              <div>
                <div className="panel-title">曝光趋势</div>
                <div className="muted" style={{ fontSize: 'var(--t-2xs)', marginTop: 2 }}>
                  全渠道合计 · 近 {range} 天
                </div>
              </div>
              <span className="tag tag-neutral">
                日均 {fmtNum(Math.round(agg.views / range))}
              </span>
            </div>
            <div className="panel-body" style={{ paddingBottom: 'var(--s-3)' }}>
              <LineChart
                labels={agg.labels}
                series={[
                  { name: '曝光', color: 'var(--accent)', data: agg.viewSeries },
                  { name: '点赞', color: 'oklch(58% 0.13 205)', data: agg.engageSeries },
                ]}
                height={228}
              />
            </div>
          </section>

          {/* 渠道构成 */}
          <section className="panel">
            <div className="panel-head">
              <div>
                <div className="panel-title">渠道曝光构成</div>
                <div className="muted" style={{ fontSize: 'var(--t-2xs)', marginTop: 2 }}>
                  Top 4 渠道每日堆叠
                </div>
              </div>
              <div className="row wrap gap-3">
                {topStacks.map((s) => (
                  <span key={s.name} className="row" style={{ gap: 5, fontSize: 'var(--t-2xs)', color: 'var(--ink-3)' }}>
                    <i style={{ width: 8, height: 8, borderRadius: 2, background: s.color, display: 'block' }} />
                    {s.name}
                  </span>
                ))}
              </div>
            </div>
            <div className="panel-body" style={{ paddingBottom: 'var(--s-3)' }}>
              <StackBars labels={agg.labels} stacks={topStacks} height={196} />
            </div>
          </section>

          {/* 渠道明细 */}
          <section className="panel">
            <div className="panel-head">
              <div className="panel-title">渠道表现明细</div>
              <Link to="/channels" className="btn btn-quiet btn-sm">
                管理渠道 <Icon name="chevronR" size={13} />
              </Link>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="tbl">
                <thead>
                  <tr>
                    <th>渠道</th>
                    <th style={{ textAlign: 'right' }}>曝光</th>
                    <th style={{ width: 90 }}>走势</th>
                    <th style={{ textAlign: 'right' }}>占比</th>
                    <th style={{ textAlign: 'right' }}>GEO 权重</th>
                    <th>状态</th>
                  </tr>
                </thead>
                <tbody>
                  {agg.byChannel.map((c) => {
                    const def = CHANNELS.find((x) => x.code === c.ch)
                    const acc = myAccounts.find((a) => a.code === c.ch)
                    const pct = ((c.views / Math.max(1, agg.views)) * 100).toFixed(1)
                    return (
                      <tr key={c.ch}>
                        <td>
                          <span className="row" style={{ gap: 8 }}>
                            <i style={{ width: 8, height: 8, borderRadius: 2, background: def?.hue, display: 'block', flex: 'none' }} />
                            <span style={{ fontWeight: 500 }}>{channelName(c.ch)}</span>
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }} className="num">
                          {fmtNum(c.views)}
                        </td>
                        <td>
                          <Spark data={c.series} color={def?.hue ?? 'var(--accent)'} width={74} height={22} />
                        </td>
                        <td style={{ textAlign: 'right' }} className="num muted">
                          {pct}%
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <span
                            className="num"
                            style={{
                              fontSize: 'var(--t-xs)',
                              color: (def?.caps.geoWeight ?? 0) >= 85 ? 'var(--ok)' : (def?.caps.geoWeight ?? 0) >= 70 ? 'var(--warn)' : 'var(--ink-3)',
                            }}
                          >
                            {def?.caps.geoWeight}
                          </span>
                        </td>
                        <td>
                          {acc?.health === 'ok' && <span className="tag tag-ok"><i className="dot" />正常</span>}
                          {acc?.health === 'expiring' && <span className="tag tag-warn"><i className="dot" />即将过期</span>}
                          {acc?.health === 'error' && <span className="tag tag-danger"><i className="dot" />异常</span>}
                          {(!acc || acc.health === 'off') && <span className="tag tag-neutral">未连接</span>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* ===== 右列 ===== */}
        <div className="col gap-4" style={{ minWidth: 0 }}>
          {/* GEO 可见度 */}
          <section className="panel">
            <div className="panel-head">
              <div className="panel-title">GEO 可见度</div>
              {latestAudit && (
                <span className="muted" style={{ fontSize: 'var(--t-2xs)' }}>
                  {relTime(latestAudit.finishedAt)}
                </span>
              )}
            </div>
            {latestAudit?.result ? (
              <div className="panel-body col" style={{ alignItems: 'center', gap: 'var(--s-4)' }}>
                <ScoreDial score={latestAudit.result.aivo.total} size={172} />
                <div className="grid g-2" style={{ width: '100%', gap: 'var(--s-2)' }}>
                  {[
                    { l: '可见性', v: latestAudit.result.aivo.visibility },
                    { l: '基建', v: latestAudit.result.aivo.infra },
                    { l: '竞争', v: latestAudit.result.aivo.competition },
                    { l: '舆情', v: latestAudit.result.aivo.sentiment },
                  ].map((x) => (
                    <div
                      key={x.l}
                      className="row-between"
                      style={{ padding: '7px 10px', background: 'var(--surface-2)', borderRadius: 'var(--r-xs)' }}
                    >
                      <span style={{ fontSize: 'var(--t-2xs)', color: 'var(--ink-3)' }}>{x.l}</span>
                      <b className="num" style={{ fontSize: 'var(--t-sm)' }}>
                        {x.v}
                      </b>
                    </div>
                  ))}
                </div>
                <Link to={`/reports/${latestAudit.id}`} className="btn btn-ghost" style={{ width: '100%' }}>
                  查看完整报告 <Icon name="chevronR" size={14} />
                </Link>
              </div>
            ) : (
              <div className="empty">
                <div className="empty-ico">
                  <Icon name="radar" size={22} />
                </div>
                <b style={{ fontSize: 'var(--t-sm)', color: 'var(--ink)' }}>还没有体检数据</b>
                <p style={{ fontSize: 'var(--t-xs)', maxWidth: '30ch', lineHeight: 1.65 }}>
                  跑一次 GEO 体检，拿到 AIVO 基线分。后续所有优化动作都以这份基线做对比。
                </p>
                <Link to="/audit" className="btn btn-primary btn-sm" style={{ marginTop: 4 }}>
                  <Icon name="play" size={13} />
                  发起首次体检
                </Link>
              </div>
            )}
          </section>

          {/* 待办 */}
          <section className="panel">
            <div className="panel-head">
              <div className="panel-title">需要处理</div>
              <span className="tag tag-accent">{unread.length + (failedTargets > 0 ? 1 : 0)}</span>
            </div>
            <div className="col">
              {failedTargets > 0 && (
                <Link
                  to="/queue"
                  className="row"
                  style={{ gap: 10, padding: 'var(--s-3) var(--s-5)', borderBottom: '1px solid var(--line)' }}
                >
                  <span style={{ color: 'var(--danger)', display: 'flex', flex: 'none' }}>
                    <Icon name="warn" size={16} />
                  </span>
                  <span className="col grow" style={{ gap: 1, minWidth: 0 }}>
                    <b style={{ fontSize: 'var(--t-xs)' }}>{failedTargets} 条分发失败</b>
                    <span className="muted" style={{ fontSize: 'var(--t-2xs)' }}>
                      多为渠道授权失效，重连后可一键重试
                    </span>
                  </span>
                  <Icon name="chevronR" size={14} />
                </Link>
              )}
              {unread.slice(0, 4).map((a) => (
                <div key={a.id} className="row" style={{ gap: 10, padding: 'var(--s-3) var(--s-5)', borderBottom: '1px solid var(--line)' }}>
                  <span
                    style={{
                      color: a.level === 'danger' ? 'var(--danger)' : a.level === 'warn' ? 'var(--warn)' : 'var(--info)',
                      display: 'flex',
                      flex: 'none',
                    }}
                  >
                    <Icon name={a.level === 'info' ? 'info' : 'warn'} size={16} />
                  </span>
                  <span className="col grow" style={{ gap: 1, minWidth: 0 }}>
                    <b style={{ fontSize: 'var(--t-xs)' }}>{a.title}</b>
                    <span className="muted clamp-2" style={{ fontSize: 'var(--t-2xs)', lineHeight: 1.55 }}>
                      {a.detail}
                    </span>
                  </span>
                </div>
              ))}
              {unread.length === 0 && failedTargets === 0 && (
                <div className="empty" style={{ padding: 'var(--s-6) var(--s-5)' }}>
                  <div className="empty-ico" style={{ color: 'var(--ok)' }}>
                    <Icon name="check" size={22} />
                  </div>
                  <b style={{ fontSize: 'var(--t-sm)', color: 'var(--ink)' }}>一切正常</b>
                  <p style={{ fontSize: 'var(--t-xs)' }}>没有需要处理的异常</p>
                </div>
              )}
            </div>
          </section>

          {/* 发布节奏 */}
          <section className="panel">
            <div className="panel-head">
              <div className="panel-title">内容与渠道</div>
              <Link to="/compose" className="btn btn-quiet btn-sm">
                去创作 <Icon name="chevronR" size={13} />
              </Link>
            </div>
            <div className="panel-body col gap-4">
              <div className="grid g-3" style={{ gap: 'var(--s-2)' }}>
                {[
                  { l: '已发布', v: published, c: 'var(--ok)' },
                  { l: '待发布', v: queued, c: 'var(--warn)' },
                  { l: '已连渠道', v: connected.length, c: 'var(--accent)' },
                ].map((x) => (
                  <div key={x.l} className="col" style={{ gap: 3, padding: '9px 11px', background: 'var(--surface-2)', borderRadius: 'var(--r-sm)' }}>
                    <span className="num" style={{ fontSize: 'var(--t-lg)', fontWeight: 500, color: x.c, lineHeight: 1 }}>
                      {x.v}
                    </span>
                    <span style={{ fontSize: 'var(--t-2xs)', color: 'var(--ink-3)' }}>{x.l}</span>
                  </div>
                ))}
              </div>
              <div>
                <div className="eyebrow" style={{ marginBottom: 10 }}>
                  内容 GEO 评分分布
                </div>
                <BarRow
                  items={myContents.slice(0, 5).map((c) => ({
                    label: c.title.length > 16 ? c.title.slice(0, 16) + '…' : c.title,
                    value: c.geoScore,
                    color: c.geoScore >= 80 ? 'var(--ok)' : c.geoScore >= 60 ? 'var(--warn)' : 'var(--danger)',
                  }))}
                  max={100}
                  suffix="分"
                />
                {myContents.length === 0 && <p className="muted" style={{ fontSize: 'var(--t-xs)' }}>该客户还没有内容</p>}
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  )
}
