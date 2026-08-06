import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../ui/Icon'
import { Counter } from '../ui/Charts'
import { AI_PLATFORMS } from '../core/types'
import type { GeoAudit } from '../core/types'
import { fmtDateTime, relTime, useStore } from '../core/store'

type Tab = 'all' | 'done' | 'running' | 'failed'

const platformName = (code: number) => AI_PLATFORMS.find((p) => p.code === code)?.name ?? `#${code}`

function gradeOf(score: number) {
  if (score >= 90) return { t: '优秀', c: 'var(--ok)' }
  if (score >= 75) return { t: '良好', c: 'var(--accent)' }
  if (score >= 60) return { t: '一般', c: 'var(--warn)' }
  return { t: '较差', c: 'var(--danger)' }
}

function statusMeta(a: GeoAudit) {
  if (a.phase === 'done' && a.result) return { t: '已完成', cls: 'tag-ok', i: 'check' as const }
  if (a.phase === 'failed') return { t: '执行失败', cls: 'tag-danger', i: 'warn' as const }
  return { t: `进行中 ${a.progress}%`, cls: 'tag-accent', i: 'refresh' as const }
}

export default function Reports() {
  const { audits, clients, activeClientId } = useStore()
  const [tab, setTab] = useState<Tab>('all')
  const [clientFilter, setClientFilter] = useState<string>('all')
  const [q, setQ] = useState('')

  const filtered = useMemo(() => {
    return audits
      .filter((a) => (tab === 'all' ? true : tab === 'done' ? a.phase === 'done' : tab === 'running' ? ['stage1', 'stage23', 'stage4'].includes(a.phase) : a.phase === 'failed'))
      .filter((a) => (clientFilter === 'all' ? true : a.clientId === clientFilter))
      .filter((a) => {
        if (!q.trim()) return true
        const k = q.trim().toLowerCase()
        return a.brand.toLowerCase().includes(k) || a.category.toLowerCase().includes(k)
      })
      .sort((a, b) => (b.finishedAt ?? b.createdAt).localeCompare(a.finishedAt ?? a.createdAt))
  }, [audits, tab, clientFilter, q])

  const done = audits.filter((a) => a.phase === 'done' && a.result)
  const avgAivo = done.length ? Math.round(done.reduce((s, a) => s + (a.result?.aivo.total ?? 0), 0) / done.length) : 0
  const monthCount = audits.filter((a) => {
    const d = new Date(a.createdAt)
    const now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length

  const tabs: { k: Tab; t: string; n: number }[] = [
    { k: 'all', t: '全部', n: audits.length },
    { k: 'done', t: '已完成', n: done.length },
    { k: 'running', t: '进行中', n: audits.filter((a) => ['stage1', 'stage23', 'stage4'].includes(a.phase)).length },
    { k: 'failed', t: '失败', n: audits.filter((a) => a.phase === 'failed').length },
  ]

  const strip = [
    { l: '报告总数', v: audits.length, icon: 'report' as const },
    { l: '本月新增', v: monthCount, icon: 'trend' as const },
    { l: '平均 AIVO', v: avgAivo || null, icon: 'target' as const, suffix: avgAivo ? '分' : '—' },
    { l: '覆盖客户', v: new Set(audits.map((a) => a.clientId)).size, icon: 'users' as const },
  ]

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow" style={{ marginBottom: 9 }}>
            报告中心 · 历史体检归档
          </div>
          <h1 className="page-title">每一份可见度体检</h1>
          <p className="page-sub">
            所有 GEO 体检报告集中归档，按客户、状态与关键词检索。报告可一键交付客户或导出 PDF。
          </p>
        </div>
        <Link to="/audit" className="btn btn-primary">
          <Icon name="radar" size={15} />
          发起体检
        </Link>
      </div>

      {/* 概览条 */}
      <div className="kpi-strip rise" style={{ marginBottom: 'var(--s-5)' }}>
        {strip.map((k) => (
          <div className="kpi" key={k.l}>
            <div className="row-between">
              <span className="eyebrow">{k.l}</span>
              <span style={{ color: 'var(--ink-4)', display: 'flex' }}>
                <Icon name={k.icon} size={14} />
              </span>
            </div>
            <div className="kpi-val">
              {k.v === null ? (
                <span className="muted">—</span>
              ) : (
                <Counter value={k.v} />
              )}
              {k.suffix && <span style={{ fontSize: '0.5em', marginLeft: 4, color: 'var(--ink-3)' }}>{k.suffix}</span>}
            </div>
          </div>
        ))}
      </div>

      {/* 过滤工具条 */}
      <div className="row-between wrap gap-3" style={{ marginBottom: 'var(--s-5)' }}>
        <div className="row wrap gap-2">
          {tabs.map((t) => (
            <button
              key={t.k}
              onClick={() => setTab(t.k)}
              className="btn btn-sm"
              style={{
                background: tab === t.k ? 'var(--accent)' : 'var(--surface)',
                color: tab === t.k ? 'var(--on-accent)' : 'var(--ink-2)',
                borderColor: tab === t.k ? 'var(--accent)' : 'var(--line)',
              }}
            >
              {t.t}
              <span className="num" style={{ opacity: 0.7 }}>
                {t.n}
              </span>
            </button>
          ))}
          <select className="select" style={{ width: 'auto' }} value={clientFilter} onChange={(e) => setClientFilter(e.target.value)}>
            <option value="all">全部客户</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.brand}
              </option>
            ))}
          </select>
        </div>
        <div className="row gap-2" style={{ flex: '1 1 220px', maxWidth: 320 }}>
          <div className="row" style={{ gap: 7, flex: 1, padding: '0 11px', background: 'var(--surface)', border: '1px solid var(--line-2)', borderRadius: 'var(--r-sm)' }}>
            <span style={{ color: 'var(--ink-4)', display: 'flex' }}>
              <Icon name="search" size={15} />
            </span>
            <input
              className="input"
              style={{ border: 'none', padding: '0.5em 0', background: 'transparent' }}
              placeholder="搜索品牌 / 品类"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="panel">
          <div className="empty">
            <div className="empty-ico">
              <Icon name="report" size={22} />
            </div>
            <b style={{ fontSize: 'var(--t-md)', color: 'var(--ink)' }}>这里还没有报告</b>
            <p style={{ fontSize: 'var(--t-sm)', maxWidth: '42ch', lineHeight: 1.7 }}>
              {audits.length === 0
                ? '发起第一次 GEO 体检，拿到 AIVO 基线分。这份报告就是后续所有优化动作的对照基线。'
                : '当前筛选条件下没有匹配的报告，换个筛选或关键词试试。'}
            </p>
            {audits.length === 0 && (
              <Link to="/audit" className="btn btn-primary btn-sm" style={{ marginTop: 4 }}>
                <Icon name="play" size={13} />
                发起首次体检
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="grid g-2" style={{ gap: 'var(--s-4)' }}>
          {filtered.map((a) => {
            const meta = statusMeta(a)
            const g = a.result ? gradeOf(a.result.aivo.total) : null
            const client = clients.find((c) => c.id === a.clientId)
            return (
              <Link
                key={a.id}
                to={a.phase === 'done' ? `/reports/${a.id}` : '/reports'}
                className="panel col gap-4"
                style={{ padding: 'var(--s-5)', transition: 'border-color var(--d-fast) var(--e-out), transform var(--d-fast) var(--e-out)', textDecoration: 'none' }}
              >
                <div className="row-between" style={{ alignItems: 'flex-start', gap: 'var(--s-3)' }}>
                  <div className="col" style={{ gap: 4, minWidth: 0 }}>
                    <span className="row gap-2">
                      <b className="truncate" style={{ fontSize: 'var(--t-md)', color: 'var(--ink)' }}>
                        {a.brand}
                      </b>
                    </span>
                    <span className="muted" style={{ fontSize: 'var(--t-2xs)' }}>
                      {a.category} · {client?.name ?? '未关联客户'}
                    </span>
                  </div>
                  <span className={`tag ${meta.cls}`}>
                    {meta.i !== 'refresh' && <Icon name={meta.i} size={11} />}
                    {meta.t}
                  </span>
                </div>

                <div className="row" style={{ gap: 'var(--s-5)', alignItems: 'flex-end' }}>
                  {a.result ? (
                    <div className="row gap-3" style={{ alignItems: 'flex-end' }}>
                      <span className="num" style={{ fontSize: '2.3rem', fontWeight: 600, lineHeight: 0.9, color: g!.c, letterSpacing: '-0.04em' }}>
                        {a.result.aivo.total}
                      </span>
                      <div className="col" style={{ gap: 1, paddingBottom: 3 }}>
                        <span className="eyebrow">AIVO</span>
                        <span className="num" style={{ fontSize: 'var(--t-xs)', color: g!.c }}>
                          {g!.t}
                        </span>
                      </div>
                    </div>
                  ) : a.phase === 'failed' ? (
                    <span className="muted" style={{ fontSize: 'var(--t-sm)' }}>
                      检测中断，无结果
                    </span>
                  ) : (
                    <div className="col" style={{ gap: 5 }}>
                      <span className="muted" style={{ fontSize: 'var(--t-2xs)' }}>检测进度</span>
                      <span className="num" style={{ fontSize: 'var(--t-md)' }}>{a.progress}%</span>
                    </div>
                  )}

                  <div className="grow" />
                  <div className="col gap-1" style={{ alignItems: 'flex-end' }}>
                    <span className="muted" style={{ fontSize: 'var(--t-2xs)' }}>
                      覆盖 {a.platforms.length}/8 平台
                    </span>
                    <span className="muted" style={{ fontSize: 'var(--t-2xs)' }}>
                      {a.phase === 'done' ? fmtDateTime(a.finishedAt) : relTime(a.createdAt)}
                    </span>
                  </div>
                </div>

                {a.result && (
                  <div className="row wrap gap-2" style={{ paddingTop: 'var(--s-3)', borderTop: '1px solid var(--line)' }}>
                    {a.platforms.slice(0, 6).map((p) => (
                      <span key={p} className="tag tag-neutral" style={{ fontSize: '0.6rem' }}>
                        {platformName(p)}
                      </span>
                    ))}
                    {a.platforms.length > 6 && <span className="tag tag-neutral" style={{ fontSize: '0.6rem' }}>+{a.platforms.length - 6}</span>}
                  </div>
                )}
              </Link>
            )
          })}
        </div>
      )}

      {filtered.length > 0 && activeClientId && (
        <div className="row gap-2" style={{ marginTop: 'var(--s-5)', justifyContent: 'center' }}>
          <span className="muted" style={{ fontSize: 'var(--t-xs)' }}>共 {filtered.length} 份报告</span>
          <Link to="/audit" className="btn btn-quiet btn-sm">
            为该客户再体检一次 <Icon name="chevronR" size={13} />
          </Link>
        </div>
      )}
    </>
  )
}
