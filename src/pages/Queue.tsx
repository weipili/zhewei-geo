import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../ui/Icon'
import { CHANNELS, channelName } from '../core/channels'
import type { ContentItem } from '../core/types'
import { fmtDateTime, fmtNum, relTime, useStore } from '../core/store'
import { api, isBackendUp } from '../core/api'

const STATUS_META: Record<ContentItem['status'], { l: string; c: string }> = {
  draft: { l: '草稿', c: 'tag-neutral' },
  queued: { l: '待发布', c: 'tag-warn' },
  publishing: { l: '发布中', c: 'tag-info' },
  published: { l: '已发布', c: 'tag-ok' },
  partial: { l: '部分成功', c: 'tag-warn' },
  failed: { l: '失败', c: 'tag-danger' },
}

export default function Queue() {
  const { contents, activeClientId, activeClient, upsertContent, removeContent } = useStore()
  const [filter, setFilter] = useState<'all' | ContentItem['status']>('all')
  const [open, setOpen] = useState<string | null>(null)
  const [backendUp, setBackendUp] = useState(false)

  useEffect(() => {
    isBackendUp().then(setBackendUp)
  }, [])

  const mine = contents.filter((c) => c.clientId === activeClientId)
  const list = filter === 'all' ? mine : mine.filter((c) => c.status === filter)

  const counts = {
    all: mine.length,
    draft: mine.filter((c) => c.status === 'draft').length,
    queued: mine.filter((c) => c.status === 'queued').length,
    published: mine.filter((c) => c.status === 'published').length,
    partial: mine.filter((c) => c.status === 'partial').length,
  }

  const retry = async (item: ContentItem, channel: string) => {
    if (backendUp) {
      const pub = await api.publish(activeClientId, item, [channel])
      const r = pub?.results?.[0]
      const targets = item.targets.map((t) =>
        t.channel === channel
          ? {
              ...t,
              status: r && r.status === 'ok' ? ('ok' as const) : ('failed' as const),
              error: r?.error,
              url: r?.url,
              publishedAt: r?.publishedAt,
            }
          : t,
      )
      upsertContent({
        ...item,
        targets,
        status: targets.every((t) => t.status === 'ok') ? 'published' : item.status,
        updatedAt: new Date().toISOString(),
      })
      return
    }
    const targets = item.targets.map((t) =>
      t.channel === channel
        ? {
            ...t,
            status: 'ok' as const,
            error: undefined,
            url: `https://example.com/${channel}/${Date.now()}`,
            publishedAt: new Date().toISOString(),
            views: Math.round(200 + Math.random() * 1800),
            likes: Math.round(8 + Math.random() * 90),
            comments: Math.round(1 + Math.random() * 20),
          }
        : t,
    )
    upsertContent({
      ...item,
      targets,
      status: targets.every((t) => t.status === 'ok') ? 'published' : item.status,
      updatedAt: new Date().toISOString(),
    })
  }

  const publishNow = async (item: ContentItem) => {
    if (backendUp) {
      const pub = await api.publish(activeClientId, item, item.targets.map((t) => t.channel))
      const targets = item.targets.map((t) => {
        const r = pub?.results?.find((x) => x.channel === t.channel)
        return r
          ? { ...t, status: r.status === 'ok' ? ('ok' as const) : ('failed' as const), url: r.url, error: r.error, publishedAt: r.publishedAt }
          : { ...t, status: 'failed' as const, error: '后端未返回结果' }
      })
      upsertContent({
        ...item,
        targets,
        status: targets.every((t) => t.status === 'ok') ? 'published' : 'partial',
        scheduledAt: undefined,
        updatedAt: new Date().toISOString(),
      })
      return
    }
    const targets = item.targets.map((t) => ({
      ...t,
      status: 'ok' as const,
      url: `https://example.com/${t.channel}/${Date.now()}`,
      publishedAt: new Date().toISOString(),
      views: Math.round(200 + Math.random() * 1800),
      likes: Math.round(8 + Math.random() * 90),
      comments: Math.round(1 + Math.random() * 20),
    }))
    upsertContent({ ...item, targets, status: 'published', scheduledAt: undefined, updatedAt: new Date().toISOString() })
  }

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow" style={{ marginBottom: 9 }}>
            发布队列 · {activeClient?.brand}
          </div>
          <h1 className="page-title">分发到哪了</h1>
          <p className="page-sub">追踪每篇内容在每个平台的落地状态。失败的可以单独重试，不用整篇重发。</p>
        </div>
        <Link to="/compose" className="btn btn-primary">
          <Icon name="plus" size={15} />
          新建内容
        </Link>
      </div>

      <div className="row wrap gap-2" style={{ marginBottom: 'var(--s-4)' }}>
        {(
          [
            { k: 'all', l: '全部', n: counts.all },
            { k: 'queued', l: '待发布', n: counts.queued },
            { k: 'published', l: '已发布', n: counts.published },
            { k: 'partial', l: '部分成功', n: counts.partial },
            { k: 'draft', l: '草稿', n: counts.draft },
          ] as const
        ).map((f) => (
          <button
            key={f.k}
            onClick={() => setFilter(f.k as typeof filter)}
            className="row"
            style={{
              gap: 7,
              padding: '6px 13px',
              borderRadius: 'var(--r-pill)',
              fontSize: 'var(--t-xs)',
              border: `1px solid ${filter === f.k ? 'var(--accent)' : 'var(--line)'}`,
              background: filter === f.k ? 'var(--accent-soft)' : 'var(--surface)',
              color: filter === f.k ? 'var(--accent-ink)' : 'var(--ink-2)',
              transition: 'all var(--d-fast) var(--e-out)',
            }}
          >
            {f.l}
            <span className="num" style={{ opacity: 0.6, fontSize: '0.68rem' }}>
              {f.n}
            </span>
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="panel">
          <div className="empty">
            <div className="empty-ico">
              <Icon name="queue" size={22} />
            </div>
            <b style={{ fontSize: 'var(--t-md)', color: 'var(--ink)' }}>这里还是空的</b>
            <p style={{ fontSize: 'var(--t-sm)', maxWidth: '40ch', lineHeight: 1.7 }}>
              内容中台写好一篇稿子，选好渠道分发，进度就会出现在这里。每个平台的成败状态都单独可见。
            </p>
            <Link to="/compose" className="btn btn-primary btn-sm" style={{ marginTop: 6 }}>
              <Icon name="compose" size={14} />
              去写第一篇
            </Link>
          </div>
        </div>
      ) : (
        <div className="col gap-3">
          {list.map((item) => {
            const okN = item.targets.filter((t) => t.status === 'ok').length
            const failN = item.targets.filter((t) => t.status === 'failed').length
            const totalViews = item.targets.reduce((s, t) => s + (t.views ?? 0), 0)
            const expanded = open === item.id

            return (
              <section className="panel" key={item.id}>
                <div className="panel-body col gap-3" style={{ paddingBottom: expanded ? 'var(--s-3)' : 'var(--s-5)' }}>
                  <div className="row-between wrap" style={{ gap: 'var(--s-3)' }}>
                    <div className="row gap-3" style={{ minWidth: 0, flex: 1 }}>
                      <span
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 'var(--r-sm)',
                          background: 'var(--surface-2)',
                          display: 'grid',
                          placeItems: 'center',
                          color: 'var(--ink-3)',
                          flex: 'none',
                        }}
                      >
                        <Icon name={item.type === 'article' ? 'doc' : 'film'} size={17} />
                      </span>
                      <div className="col" style={{ gap: 3, minWidth: 0 }}>
                        <b style={{ fontSize: 'var(--t-md)', lineHeight: 1.4 }} className="clamp-2">
                          {item.title}
                        </b>
                        <span className="row wrap" style={{ gap: 10, fontSize: 'var(--t-2xs)', color: 'var(--ink-3)' }}>
                          <span>{relTime(item.updatedAt)}</span>
                          {item.scheduledAt && (
                            <span className="row" style={{ gap: 4, color: 'var(--warn)' }}>
                              <Icon name="clock" size={11} />
                              {fmtDateTime(item.scheduledAt)} 发布
                            </span>
                          )}
                          {totalViews > 0 && <span className="num">曝光 {fmtNum(totalViews)}</span>}
                        </span>
                      </div>
                    </div>
                    <div className="row gap-2">
                      <span className={`tag ${item.geoScore >= 80 ? 'tag-ok' : item.geoScore >= 60 ? 'tag-warn' : 'tag-danger'}`}>
                        GEO {item.geoScore}
                      </span>
                      <span className={`tag ${STATUS_META[item.status].c}`}>{STATUS_META[item.status].l}</span>
                    </div>
                  </div>

                  {/* 渠道进度条 */}
                  {item.targets.length > 0 && (
                    <div className="row wrap gap-2">
                      {item.targets.map((t) => {
                        const def = CHANNELS.find((c) => c.code === t.channel)
                        return (
                          <span
                            key={t.channel}
                            className="row"
                            style={{
                              gap: 6,
                              padding: '4px 10px',
                              borderRadius: 'var(--r-pill)',
                              fontSize: 'var(--t-2xs)',
                              border: '1px solid',
                              borderColor:
                                t.status === 'ok'
                                  ? 'color-mix(in oklch, var(--ok) 30%, transparent)'
                                  : t.status === 'failed'
                                    ? 'color-mix(in oklch, var(--danger) 30%, transparent)'
                                    : 'var(--line)',
                              background: t.status === 'ok' ? 'var(--ok-soft)' : t.status === 'failed' ? 'var(--danger-soft)' : 'var(--surface-2)',
                              color: t.status === 'ok' ? 'var(--ok)' : t.status === 'failed' ? 'var(--danger)' : 'var(--ink-3)',
                            }}
                          >
                            <i style={{ width: 6, height: 6, borderRadius: 2, background: def?.hue, display: 'block' }} />
                            {channelName(t.channel)}
                            {t.status === 'ok' && <Icon name="check" size={11} />}
                            {t.status === 'failed' && <Icon name="x" size={11} />}
                            {t.status === 'pending' && <Icon name="clock" size={11} />}
                          </span>
                        )
                      })}
                    </div>
                  )}

                  <div className="row-between wrap" style={{ gap: 'var(--s-3)', paddingTop: 3 }}>
                    <span className="muted" style={{ fontSize: 'var(--t-2xs)' }}>
                      {item.targets.length > 0 ? `${okN} 成功 · ${failN} 失败 · 共 ${item.targets.length} 个渠道` : '草稿，尚未分发'}
                    </span>
                    <div className="row gap-2">
                      {item.status === 'queued' && (
                        <button className="btn btn-ghost btn-sm" onClick={() => publishNow(item)}>
                          <Icon name="send" size={13} />
                          立即发布
                        </button>
                      )}
                      {item.targets.length > 0 && (
                        <button className="btn btn-quiet btn-sm" onClick={() => setOpen(expanded ? null : item.id)}>
                          {expanded ? '收起' : '明细'}
                          <span style={{ transform: expanded ? 'rotate(180deg)' : 'none', display: 'inline-flex', transition: 'transform var(--d-fast)' }}>
                            <Icon name="chevronD" size={13} />
                          </span>
                        </button>
                      )}
                      <button className="btn btn-quiet btn-sm" onClick={() => removeContent(item.id)} title="删除">
                        <Icon name="trash" size={13} />
                      </button>
                    </div>
                  </div>
                </div>

                {expanded && (
                  <div style={{ borderTop: '1px solid var(--line)', overflowX: 'auto' }} className="fade">
                    <table className="tbl">
                      <thead>
                        <tr>
                          <th>渠道</th>
                          <th>状态</th>
                          <th style={{ textAlign: 'right' }}>曝光</th>
                          <th style={{ textAlign: 'right' }}>点赞</th>
                          <th style={{ textAlign: 'right' }}>评论</th>
                          <th>时间</th>
                          <th style={{ width: 96 }}>操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {item.targets.map((t) => (
                          <tr key={t.channel}>
                            <td style={{ fontWeight: 500 }}>{channelName(t.channel)}</td>
                            <td>
                              {t.status === 'ok' && <span className="tag tag-ok">成功</span>}
                              {t.status === 'failed' && (
                                <span className="row gap-2">
                                  <span className="tag tag-danger">失败</span>
                                  <span className="muted" style={{ fontSize: 'var(--t-2xs)' }}>
                                    {t.error}
                                  </span>
                                </span>
                              )}
                              {t.status === 'pending' && <span className="tag tag-warn">等待中</span>}
                            </td>
                            <td style={{ textAlign: 'right' }} className="num">
                              {t.views ? fmtNum(t.views) : '—'}
                            </td>
                            <td style={{ textAlign: 'right' }} className="num">
                              {t.likes ?? '—'}
                            </td>
                            <td style={{ textAlign: 'right' }} className="num">
                              {t.comments ?? '—'}
                            </td>
                            <td className="muted" style={{ fontSize: 'var(--t-2xs)' }}>
                              {t.publishedAt ? fmtDateTime(t.publishedAt) : '—'}
                            </td>
                            <td>
                              {t.status === 'failed' && (
                                <button className="btn btn-ghost btn-sm" onClick={() => retry(item, t.channel)}>
                                  <Icon name="refresh" size={12} />
                                  重试
                                </button>
                              )}
                              {t.status === 'ok' && t.url && (
                                <a className="btn btn-quiet btn-sm" href={t.url} target="_blank" rel="noreferrer">
                                  <Icon name="external" size={12} />
                                  查看
                                </a>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )
          })}
        </div>
      )}
    </>
  )
}
