import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '../ui/Icon'
import { CHANNELS } from '../core/channels'
import { scoreContentGeo } from '../core/geoEngine'
import type { ContentItem, DispatchTarget } from '../core/types'
import { newId, useStore } from '../core/store'
import { api, isBackendUp } from '../core/api'

type Tab = 'edit' | 'geo' | 'preview'

export default function Compose() {
  const { activeClientId, activeClient, accounts, upsertContent } = useStore()
  const nav = useNavigate()

  const [type, setType] = useState<'article' | 'video'>('article')
  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [body, setBody] = useState('')
  const [tagsRaw, setTagsRaw] = useState('')
  const [qaPairs, setQaPairs] = useState<{ q: string; a: string }[]>([{ q: '', a: '' }])
  const [picked, setPicked] = useState<string[]>([])
  const [scheduled, setScheduled] = useState('')
  const [tab, setTab] = useState<Tab>('edit')
  const [previewCh, setPreviewCh] = useState<string>('zhihu')
  const [toast, setToast] = useState<string | null>(null)
  const [aiBusy, setAiBusy] = useState(false)
  const [backendUp, setBackendUp] = useState(false)

  useEffect(() => {
    isBackendUp().then(setBackendUp)
  }, [])

  const tags = tagsRaw.split(/[,，\s]+/).filter(Boolean)
  const myAccounts = accounts.filter((a) => a.clientId === activeClientId)
  const available = CHANNELS.filter((c) => c.kind === 'both' || c.kind === type)

  const geo = useMemo(() => scoreContentGeo({ title, body, summary, tags, qaPairs }), [title, body, summary, tagsRaw, qaPairs])

  const bodyLen = body.replace(/\s/g, '').length

  const togglePick = (code: string) => setPicked((p) => (p.includes(code) ? p.filter((x) => x !== code) : [...p, code]))

  /** 按目标平台自动适配内容 */
  const adapt = (code: string) => {
    const def = CHANNELS.find((c) => c.code === code)!
    let t = title
    let b = body
    const warns: string[] = []

    if (def.titleLimit > 0 && t.length > def.titleLimit) {
      t = t.slice(0, def.titleLimit - 1) + '…'
      warns.push(`标题超出 ${def.titleLimit} 字，已自动截断`)
    }
    if (def.bodyLimit > 0 && b.length > def.bodyLimit) {
      // 小红书类短内容：保留摘要 + 问答对精华
      if (def.bodyLimit <= 1200) {
        const qa = qaPairs
          .filter((q) => q.q && q.a)
          .slice(0, 3)
          .map((q) => `Q：${q.q}\nA：${q.a}`)
          .join('\n\n')
        b = `${summary}\n\n${qa}`.slice(0, def.bodyLimit)
        warns.push(`正文超出 ${def.bodyLimit} 字，已重组为「摘要 + 精华问答」短版`)
      } else {
        b = b.slice(0, def.bodyLimit) + '…'
        warns.push(`正文超出 ${def.bodyLimit} 字，已截断`)
      }
    }
    if (def.caps.tags && tags.length === 0) warns.push('该平台支持话题标签，建议补充以提升分发权重')
    if (!def.caps.tags && tags.length > 0) warns.push('该平台不支持标签，标签将被忽略')

    return { def, t, b, warns }
  }

  const aiGenerate = async () => {
    if (!activeClient) {
      setToast('请先选择客户')
      setTimeout(() => setToast(null), 2200)
      return
    }
    setAiBusy(true)
    setToast(null)
    try {
      const r = await api.aiGenerate({
        client: activeClient,
        type,
        platform: previewCh,
      })
      if (r && r.title && r.body) {
        setTitle(r.title)
        setSummary(r.summary || '')
        setBody(r.body)
        setTagsRaw((r.tags || []).join('、'))
        setQaPairs(r.qaPairs && r.qaPairs.length ? r.qaPairs : [{ q: '', a: '' }])
        setTab('edit')
        setToast(r.note || 'AI 已生成原创内容，请核对事实后发布')
      } else {
        setToast('AI 生成失败：后端未启动，或未配置大模型 Key（当前走启发式模板）')
      }
    } catch (e) {
      setToast(`AI 生成异常：${String(e)}`)
    }
    setAiBusy(false)
    setTimeout(() => setToast(null), 3200)
  }

  const save = async (asDraft: boolean) => {
    if (!title.trim()) {
      setToast('标题不能为空')
      setTimeout(() => setToast(null), 2200)
      return
    }
    if (!asDraft && picked.length === 0) {
      setToast('请至少选择一个分发渠道')
      setTimeout(() => setToast(null), 2200)
      return
    }

    let targets: DispatchTarget[] = []
    if (!asDraft && !scheduled && backendUp) {
      const pub = await api.publish(
        activeClientId,
        { id: newId('ct'), title: title.trim(), summary: summary.trim(), body, tags },
        picked,
      )
      targets = (pub?.results || []).map((x) => ({
        channel: x.channel,
        status: x.status === 'ok' ? ('ok' as const) : ('failed' as const),
        url: x.url,
        error: x.error,
        publishedAt: x.publishedAt,
      }))
    } else {
      targets = picked.map((code) => {
        const acc = myAccounts.find((a) => a.code === code)
        const ok = acc?.connected && acc.health !== 'error'
        return {
          channel: code,
          status: asDraft ? ('pending' as const) : ok ? ('ok' as const) : ('failed' as const),
          error: ok ? undefined : '渠道未连接或授权异常',
          url: !asDraft && ok ? `https://example.com/${code}/${Date.now()}` : undefined,
          publishedAt: !asDraft && ok ? new Date().toISOString() : undefined,
          views: !asDraft && ok ? Math.round(300 + Math.random() * 2600) : undefined,
          likes: !asDraft && ok ? Math.round(10 + Math.random() * 140) : undefined,
          comments: !asDraft && ok ? Math.round(2 + Math.random() * 30) : undefined,
        }
      })
    }

    const item: ContentItem = {
      id: newId('ct'),
      clientId: activeClientId,
      type,
      title: title.trim(),
      summary: summary.trim(),
      body,
      tags,
      qaPairs: qaPairs.filter((q) => q.q.trim() && q.a.trim()),
      status: asDraft ? 'draft' : scheduled ? 'queued' : targets.some((t) => t.status === 'failed') ? 'partial' : 'published',
      scheduledAt: scheduled ? new Date(scheduled).toISOString() : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      targets: asDraft ? [] : targets,
      geoScore: geo.score,
    }
    upsertContent(item)
    nav('/queue')
  }

  const preview = adapt(previewCh)

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow" style={{ marginBottom: 9 }}>
            内容中台 · {activeClient?.brand}
          </div>
          <h1 className="page-title">写一次，投全网</h1>
          <p className="page-sub">
            一份原稿自动适配各平台的字数与格式限制。发布前会做 GEO 结构化体检——问答对、疑问句标题、小标题分段，
            这几项直接决定内容能不能被 AI 引用。
          </p>
        </div>
        <div className="row gap-2">
          <button className="btn btn-ghost" onClick={aiGenerate} disabled={aiBusy}>
            <Icon name="sparkle" size={15} />
            {aiBusy ? '生成中…' : 'AI 生成'}
          </button>
          <button className="btn btn-ghost" onClick={() => save(true)}>
            存草稿
          </button>
          <button className="btn btn-primary" onClick={() => save(false)}>
            <Icon name="send" size={15} />
            {scheduled ? '加入队列' : '立即分发'}
          </button>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'minmax(0,1.5fr) minmax(0,1fr)', gap: 'var(--s-5)' }}>
        {/* ===== 编辑区 ===== */}
        <div className="col gap-4" style={{ minWidth: 0 }}>
          <section className="panel">
            <div className="panel-head" style={{ padding: 0 }}>
              <div className="row" style={{ gap: 0 }}>
                {(
                  [
                    { k: 'edit', l: '撰写', i: 'compose' },
                    { k: 'geo', l: 'GEO 体检', i: 'target' },
                    { k: 'preview', l: '平台预览', i: 'film' },
                  ] as { k: Tab; l: string; i: 'compose' | 'target' | 'film' }[]
                ).map((t) => (
                  <button
                    key={t.k}
                    onClick={() => setTab(t.k)}
                    className="row"
                    style={{
                      gap: 7,
                      padding: '14px 18px',
                      fontSize: 'var(--t-sm)',
                      fontWeight: 500,
                      color: tab === t.k ? 'var(--ink)' : 'var(--ink-3)',
                      borderBottom: `2px solid ${tab === t.k ? 'var(--accent)' : 'transparent'}`,
                      marginBottom: -1,
                      transition: 'all var(--d-fast) var(--e-out)',
                    }}
                  >
                    <Icon name={t.i} size={15} />
                    {t.l}
                    {t.k === 'geo' && (
                      <span
                        className={`tag ${geo.score >= 80 ? 'tag-ok' : geo.score >= 60 ? 'tag-warn' : 'tag-danger'}`}
                        style={{ marginLeft: 2 }}
                      >
                        {geo.score}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* --- 撰写 --- */}
            {tab === 'edit' && (
              <div className="panel-body col gap-5">
                <div className="row gap-2">
                  {(['article', 'video'] as const).map((t) => (
                    <button
                      key={t}
                      className="checkcard"
                      data-on={type === t}
                      onClick={() => {
                        setType(t)
                        setPicked([])
                      }}
                      style={{ flex: 1 }}
                    >
                      <Icon name={t === 'article' ? 'doc' : 'film'} size={16} />
                      {t === 'article' ? '图文文章' : '视频内容'}
                    </button>
                  ))}
                </div>

                <div className="field">
                  <div className="row-between">
                    <label className="label">
                      标题 <span className="req">*</span>
                    </label>
                    <span className="hint num">{title.length} 字</span>
                  </div>
                  <input
                    className="input"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="用疑问句更容易被 AI 命中，例：合肥企业采购电脑怎么选才不踩坑？"
                  />
                </div>

                <div className="field">
                  <label className="label">摘要</label>
                  <textarea
                    className="textarea"
                    style={{ minHeight: 74 }}
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder="一句话说清这篇内容解决什么问题。摘要是 AI 判定主题的入口。"
                  />
                </div>

                <div className="field">
                  <div className="row-between">
                    <label className="label">正文</label>
                    <span className="hint num">{bodyLen} 字</span>
                  </div>
                  <textarea
                    className="textarea"
                    style={{ minHeight: 260, fontFamily: 'var(--font-sans)' }}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder={'支持用 ## 写小标题。层级结构能让 AI 更容易定位与摘录段落。\n\n## 一、先说结论\n\n…'}
                  />
                </div>

                <div className="field">
                  <label className="label">标签</label>
                  <input className="input" value={tagsRaw} onChange={(e) => setTagsRaw(e.target.value)} placeholder="逗号或空格分隔，例：企业采购 电脑选购 合肥IT" />
                  {tags.length > 0 && (
                    <div className="row wrap gap-2" style={{ marginTop: 4 }}>
                      {tags.map((t) => (
                        <span key={t} className="tag tag-accent">
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* --- GEO 体检 --- */}
            {tab === 'geo' && (
              <div className="panel-body col gap-5">
                <div
                  className="row-between"
                  style={{
                    padding: 'var(--s-4)',
                    background: geo.score >= 80 ? 'var(--ok-soft)' : geo.score >= 60 ? 'var(--warn-soft)' : 'var(--danger-soft)',
                    borderRadius: 'var(--r-sm)',
                  }}
                >
                  <div className="col" style={{ gap: 3 }}>
                    <span className="eyebrow">内容 GEO 评分</span>
                    <span style={{ fontSize: 'var(--t-xs)', color: 'var(--ink-2)', maxWidth: '40ch', lineHeight: 1.6 }}>
                      {geo.score >= 80
                        ? '结构达标，被 AI 引用的概率良好。可以发了。'
                        : geo.score >= 60
                          ? '基本可用，但还有明显提升空间。补齐下面未通过的项。'
                          : '结构薄弱，建议补齐后再发，否则很难进入 AI 引用池。'}
                    </span>
                  </div>
                  <span
                    className="num"
                    style={{
                      fontSize: 'var(--t-2xl)',
                      fontWeight: 600,
                      lineHeight: 1,
                      color: geo.score >= 80 ? 'var(--ok)' : geo.score >= 60 ? 'var(--warn)' : 'var(--danger)',
                    }}
                  >
                    {geo.score}
                  </span>
                </div>

                <div className="col gap-2">
                  {geo.items.map((it) => (
                    <div
                      key={it.label}
                      className="row"
                      style={{ gap: 11, padding: '11px 13px', background: 'var(--surface-2)', borderRadius: 'var(--r-sm)', alignItems: 'flex-start' }}
                    >
                      <span
                        style={{
                          width: 19,
                          height: 19,
                          borderRadius: '50%',
                          display: 'grid',
                          placeItems: 'center',
                          flex: 'none',
                          marginTop: 1,
                          background: it.pass ? 'var(--ok)' : 'var(--surface)',
                          border: it.pass ? 'none' : '1.5px solid var(--line-strong)',
                          color: '#fff',
                        }}
                      >
                        {it.pass && <Icon name="check" size={11} />}
                      </span>
                      <span className="col grow" style={{ gap: 2, minWidth: 0 }}>
                        <span className="row-between">
                          <b style={{ fontSize: 'var(--t-xs)', color: it.pass ? 'var(--ink)' : 'var(--ink-2)' }}>{it.label}</b>
                          <span className="num muted" style={{ fontSize: 'var(--t-2xs)' }}>
                            {it.pass ? '+' : ''}
                            {it.pass ? it.weight : 0} / {it.weight}
                          </span>
                        </span>
                        <span className="muted" style={{ fontSize: 'var(--t-2xs)', lineHeight: 1.6 }}>
                          {it.tip}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>

                {/* 问答对编辑 */}
                <div className="field">
                  <div className="row-between">
                    <label className="label">
                      结构化问答对
                      <span className="tag tag-accent" style={{ marginLeft: 6 }}>
                        权重最高
                      </span>
                    </label>
                    <button className="btn btn-ghost btn-sm" onClick={() => setQaPairs((q) => [...q, { q: '', a: '' }])}>
                      <Icon name="plus" size={13} />
                      添加
                    </button>
                  </div>
                  <span className="hint" style={{ marginBottom: 4 }}>
                    用户是用问题跟 AI 对话的。内容里有现成的问答对，被抽取引用的概率能提升近一倍。建议至少 3 组。
                  </span>
                  <div className="col gap-3">
                    {qaPairs.map((qa, i) => (
                      <div key={i} className="col gap-2" style={{ padding: 'var(--s-3)', background: 'var(--surface-2)', borderRadius: 'var(--r-sm)' }}>
                        <div className="row gap-2">
                          <span className="mono" style={{ fontSize: 'var(--t-2xs)', color: 'var(--accent)', fontWeight: 600, paddingTop: 8, flex: 'none' }}>
                            Q{i + 1}
                          </span>
                          <input
                            className="input"
                            value={qa.q}
                            onChange={(e) => setQaPairs((p) => p.map((x, j) => (j === i ? { ...x, q: e.target.value } : x)))}
                            placeholder="用户可能会问什么？"
                          />
                          {qaPairs.length > 1 && (
                            <button
                              className="btn btn-quiet btn-icon"
                              onClick={() => setQaPairs((p) => p.filter((_, j) => j !== i))}
                              title="删除"
                              style={{ flex: 'none' }}
                            >
                              <Icon name="x" size={14} />
                            </button>
                          )}
                        </div>
                        <div className="row gap-2">
                          <span className="mono" style={{ fontSize: 'var(--t-2xs)', color: 'var(--ok)', fontWeight: 600, paddingTop: 8, flex: 'none' }}>
                            A{i + 1}
                          </span>
                          <textarea
                            className="textarea"
                            style={{ minHeight: 58 }}
                            value={qa.a}
                            onChange={(e) => setQaPairs((p) => p.map((x, j) => (j === i ? { ...x, a: e.target.value } : x)))}
                            placeholder="给出直接、具体、可被引用的答案"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* --- 平台预览 --- */}
            {tab === 'preview' && (
              <div className="panel-body col gap-4">
                <div className="row wrap gap-2">
                  {available.map((c) => (
                    <button
                      key={c.code}
                      onClick={() => setPreviewCh(c.code)}
                      className="row"
                      style={{
                        gap: 7,
                        padding: '6px 11px',
                        borderRadius: 'var(--r-sm)',
                        fontSize: 'var(--t-xs)',
                        border: `1px solid ${previewCh === c.code ? 'var(--accent)' : 'var(--line)'}`,
                        background: previewCh === c.code ? 'var(--accent-soft)' : 'var(--surface)',
                        color: previewCh === c.code ? 'var(--accent-ink)' : 'var(--ink-2)',
                        transition: 'all var(--d-fast) var(--e-out)',
                      }}
                    >
                      <i style={{ width: 7, height: 7, borderRadius: 2, background: c.hue, display: 'block' }} />
                      {c.name}
                    </button>
                  ))}
                </div>

                <div className="col gap-3" style={{ padding: 'var(--s-4)', background: 'var(--bg-sunk)', borderRadius: 'var(--r-sm)', border: '1px solid var(--line)' }}>
                  <div className="row-between">
                    <span className="eyebrow">{preview.def.name} 效果</span>
                    <span className="row gap-2">
                      <span className="tag tag-neutral num">
                        标题 {preview.t.length}/{preview.def.titleLimit || '∞'}
                      </span>
                      <span className="tag tag-neutral num">
                        正文 {preview.b.length}/{preview.def.bodyLimit || '∞'}
                      </span>
                    </span>
                  </div>
                  {preview.def.titleLimit > 0 && (
                    <h3 style={{ fontSize: 'var(--t-md)', fontWeight: 600, lineHeight: 1.4 }}>{preview.t || '（未填写标题）'}</h3>
                  )}
                  <p style={{ fontSize: 'var(--t-sm)', lineHeight: 1.85, color: 'var(--ink-2)', whiteSpace: 'pre-wrap' }}>
                    {preview.b || '（未填写正文）'}
                  </p>
                  {preview.def.caps.tags && tags.length > 0 && (
                    <div className="row wrap gap-2">
                      {tags.map((t) => (
                        <span key={t} style={{ fontSize: 'var(--t-xs)', color: 'var(--info)' }}>
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {preview.warns.length > 0 && (
                  <div className="callout" data-tone="warn">
                    <div className="callout-h">
                      <Icon name="warn" size={14} />
                      自动适配说明
                    </div>
                    <ul className="rpt-list">
                      {preview.warns.map((w, i) => (
                        <li key={i} style={{ fontSize: 'var(--t-xs)' }}>
                          {w}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <p className="hint">{preview.def.tip}</p>
              </div>
            )}
          </section>
        </div>

        {/* ===== 分发设置 ===== */}
        <div className="col gap-4" style={{ minWidth: 0 }}>
          <section className="panel" style={{ position: 'sticky', top: 'calc(var(--topbar-h) + var(--s-4))' }}>
            <div className="panel-head">
              <div className="panel-title">分发渠道</div>
              <span className="tag tag-accent">已选 {picked.length}</span>
            </div>
            <div className="panel-body col gap-4">
              <div className="col gap-2">
                {available.map((c) => {
                  const acc = myAccounts.find((a) => a.code === c.code)
                  const on = picked.includes(c.code)
                  const usable = acc?.connected && acc.health !== 'error'
                  return (
                    <button
                      key={c.code}
                      className="checkcard"
                      data-on={on}
                      onClick={() => togglePick(c.code)}
                      style={{ opacity: usable ? 1 : 0.55 }}
                      title={usable ? c.tip : '该渠道未连接或授权异常'}
                    >
                      <span className="box">
                        <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="var(--on-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1.5 5.2 3.9 7.6 8.5 2.4" />
                        </svg>
                      </span>
                      <i style={{ width: 8, height: 8, borderRadius: 2, background: c.hue, display: 'block', flex: 'none' }} />
                      <span className="col grow" style={{ gap: 0, alignItems: 'flex-start', minWidth: 0 }}>
                        <span className="truncate" style={{ fontSize: 'var(--t-xs)', fontWeight: 500 }}>
                          {c.name}
                        </span>
                        <span className="muted" style={{ fontSize: '0.62rem' }}>
                          GEO 权重 {c.caps.geoWeight}
                        </span>
                      </span>
                      {!usable && <span className="tag tag-danger">未连接</span>}
                    </button>
                  )
                })}
              </div>

              <div className="field">
                <label className="label">
                  <Icon name="clock" size={13} />
                  定时发布
                </label>
                <input className="input" type="datetime-local" value={scheduled} onChange={(e) => setScheduled(e.target.value)} />
                <span className="hint">留空则立即分发。定时任务会进入发布队列等待执行。</span>
              </div>

              {picked.length > 0 && (
                <div className="col gap-2" style={{ padding: 'var(--s-3)', background: 'var(--surface-2)', borderRadius: 'var(--r-sm)' }}>
                  <span className="eyebrow">本次分发覆盖</span>
                  <div className="row-between">
                    <span style={{ fontSize: 'var(--t-xs)', color: 'var(--ink-2)' }}>加权 GEO 价值</span>
                    <b className="num" style={{ fontSize: 'var(--t-sm)', color: 'var(--accent)' }}>
                      {Math.round(picked.reduce((s, c) => s + (CHANNELS.find((x) => x.code === c)?.caps.geoWeight ?? 0), 0) / picked.length)}
                    </b>
                  </div>
                  <p className="muted" style={{ fontSize: 'var(--t-2xs)', lineHeight: 1.6 }}>
                    优先投放知乎、百家号、公众号这类高权重平台，同样的内容 GEO 收益更高。
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {toast && (
        <div
          className="rise"
          style={{
            position: 'fixed',
            bottom: 26,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--danger)',
            color: '#fff',
            padding: '10px 18px',
            borderRadius: 'var(--r-sm)',
            fontSize: 'var(--t-sm)',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 200,
          }}
        >
          {toast}
        </div>
      )}
    </>
  )
}
