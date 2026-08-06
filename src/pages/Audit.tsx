import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '../ui/Icon'
import { runGeoAudit } from '../core/geoEngine'
import type { StageEvent } from '../core/geoEngine'
import { AI_PLATFORMS } from '../core/types'
import type { GeoAudit } from '../core/types'
import { newId, useStore } from '../core/store'
import { api, isBackendUp } from '../core/api'

const STAGE_MAP = [
  { key: 'stage1', n: '01', title: '基础调研', desc: '用户画像 · 基建评估 · 竞品扫描' },
  { key: 'stage23', n: '02', title: '收录 + 生态', desc: '八平台收录查询 · 联网搜生态布局 · 情感分析（并行）' },
  { key: 'stage4', n: '03', title: '评分 + 横评', desc: 'AIVO 四维加权 · 行业横评对标 · 行动建议' },
  { key: 'done', n: '04', title: '生成报告', desc: '结构化归档，可导出交付客户' },
]

export default function Audit() {
  const { activeClient, clients, activeClientId, setActiveClientId, upsertAudit } = useStore()
  const nav = useNavigate()

  const [brand, setBrand] = useState(activeClient?.brand ?? '')
  const [category, setCategory] = useState(activeClient?.category ?? '')
  const [website, setWebsite] = useState(activeClient?.website ?? '')
  const [platforms, setPlatforms] = useState<number[]>([1, 2, 3, 4, 5, 6, 7, 8])
  const [realSearch, setRealSearch] = useState(false)
  const [backendUp, setBackendUp] = useState(false)

  useEffect(() => {
    isBackendUp().then((up) => {
      setBackendUp(up)
      if (up) setRealSearch(true)
    })
  }, [])
  const [running, setRunning] = useState(false)
  const [ev, setEv] = useState<StageEvent | null>(null)
  const [log, setLog] = useState<string[]>([])

  const syncFromClient = (id: string) => {
    setActiveClientId(id)
    const c = clients.find((x) => x.id === id)
    if (c) {
      setBrand(c.brand)
      setCategory(c.category)
      setWebsite(c.website ?? '')
    }
  }

  const toggle = (code: number) =>
    setPlatforms((p) => (p.includes(code) ? p.filter((x) => x !== code) : [...p, code].sort((a, b) => a - b)))

  const canRun = brand.trim() && category.trim() && platforms.length > 0 && !running

  const start = async () => {
    if (!canRun) return
    setRunning(true)
    setLog([])
    const id = newId('gd')
    const base: GeoAudit = {
      id,
      clientId: activeClientId,
      brand: brand.trim(),
      category: category.trim(),
      website: website.trim() || undefined,
      platforms,
      phase: 'stage1',
      progress: 0,
      createdAt: new Date().toISOString(),
    }
    upsertAudit(base)

    try {
      const result = backendUp
        ? await (async () => {
            const steps: { p: GeoAudit['phase']; prog: number; label: string; detail: string }[] = [
              { p: 'stage1', prog: 20, label: '阶段 1 · 基础调研', detail: '构建画像 / 基建 / 竞品（后端联网）…' },
              { p: 'stage23', prog: 45, label: '阶段 2+3 · 联网检索', detail: '调用后端真实爬虫检索全网露出…' },
              { p: 'stage23', prog: 68, label: '阶段 2+3 · 舆情分析', detail: '聚合舆情词与情感倾向…' },
              { p: 'stage4', prog: 84, label: '阶段 4 · 评分建议', detail: '计算 AIVO 四维评分与行动建议…' },
            ]
            for (const st of steps) {
              setEv({ phase: st.p, progress: st.prog, label: st.label, detail: st.detail })
              setLog((l) => [...l, `[${st.label}] ${st.detail}`])
              upsertAudit({ ...base, phase: st.p, progress: st.prog })
              await new Promise((r) => setTimeout(r, 420))
            }
            const r = await api.geoAudit({
              brand: brand.trim(),
              category: category.trim(),
              website: website.trim() || undefined,
              platforms,
            })
            if (!r?.result) throw new Error('后端分析未返回结果')
            return r.result as NonNullable<GeoAudit['result']>
          })()
        : await runGeoAudit({
            brand: brand.trim(),
            category: category.trim(),
            website: website.trim() || undefined,
            platforms,
            realSearch,
            onProgress: (e) => {
              setEv(e)
              setLog((l) => [...l, `[${e.label}] ${e.detail}`])
              upsertAudit({ ...base, phase: e.phase, progress: e.progress })
            },
          })
      upsertAudit({
        ...base,
        phase: 'done',
        progress: 100,
        finishedAt: new Date().toISOString(),
        result,
      })
      setTimeout(() => nav(`/reports/${id}`), 520)
    } catch (e) {
      upsertAudit({ ...base, phase: 'failed', progress: 0 })
      setLog((l) => [...l, `⚠️ 执行失败：${String(e)}`])
      setRunning(false)
    }
  }

  const curIdx = !ev ? -1 : ev.phase === 'stage1' ? 0 : ev.phase === 'stage23' ? 1 : ev.phase === 'stage4' ? 2 : 3

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow" style={{ marginBottom: 9 }}>
            GEO 体检
          </div>
          <h1 className="page-title">品牌在 AI 里长什么样</h1>
          <p className="page-sub">
            向八大中文 AI 平台发起虚拟收录查询，测算品牌提及率、基建完善度、竞争位置与舆情健康度，
            输出 AIVO 四维评分与可执行的改进清单。
          </p>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.05fr)', gap: 'var(--s-5)' }}>
        {/* ---- 参数表单 ---- */}
        <section className="panel" style={{ alignSelf: 'start' }}>
          <div className="panel-head">
            <div className="panel-title">检测参数</div>
            <span className="sprockets">
              {Array.from({ length: 5 }, (_, i) => (
                <i key={i} />
              ))}
            </span>
          </div>
          <div className="panel-body col gap-5">
            <div className="field">
              <label className="label">关联客户</label>
              <select className="select" value={activeClientId} onChange={(e) => syncFromClient(e.target.value)} disabled={running}>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.brand} · {c.name}
                  </option>
                ))}
              </select>
              <span className="hint">切换客户会自动带出该品牌已登记的信息</span>
            </div>

            <div className="grid g-2" style={{ gap: 'var(--s-4)' }}>
              <div className="field">
                <label className="label">
                  品牌名称 <span className="req">*</span>
                </label>
                <input className="input" value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="例：哲唯科技" disabled={running} />
              </div>
              <div className="field">
                <label className="label">
                  产品类型 <span className="req">*</span>
                </label>
                <input className="input" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="例：电脑IT硬件" disabled={running} />
              </div>
            </div>

            <div className="field">
              <label className="label">官网地址</label>
              <input className="input" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://" disabled={running} />
              <span className="hint">
                有官网可显著提高基建维度得分。AI 依赖结构化事实判断品牌可信度，这是最容易补的一块短板。
              </span>
            </div>

            <div className="field">
              <div className="row-between">
                <label className="label">
                  联网搜索模式
                  <span className={`tag ${realSearch ? 'tag-ok' : 'tag-neutral'}`} style={{ fontSize: '0.58rem', marginLeft: 6 }}>
                    {realSearch ? '真实联网' : '模拟推演'}
                    <span className={`tag ${backendUp ? 'tag-ok' : 'tag-neutral'}`} style={{ fontSize: '0.58rem', marginLeft: 6 }}>
                      后端{backendUp ? '已连接' : '离线'}
                    </span>
                  </span>
                </label>
                <button
                  className="switch"
                  data-on={realSearch}
                  role="switch"
                  aria-checked={realSearch}
                  aria-label="切换真实/模拟联网"
                  onClick={() => setRealSearch((v) => !v)}
                >
                  <i />
                </button>
              </div>
              <span className="hint">
                {realSearch
                  ? '真实联网：后端在线时调用真实爬虫检索生态布局 / 行业横评 / 长尾词，并做官网抓取与大模型实测（如配置 Key）。'
                  : '模拟推演：使用虚拟数据验证报告形态与渲染，不发起真实搜索。'}
              </span>
            </div>

            <div className="field">
              <div className="row-between">
                <label className="label">
                  检测平台 <span className="req">*</span>
                </label>
                <div className="row gap-2">
                  <button className="btn btn-quiet btn-sm" onClick={() => setPlatforms([1, 2, 3, 4, 5, 6, 7, 8])} disabled={running}>
                    全选
                  </button>
                  <button className="btn btn-quiet btn-sm" onClick={() => setPlatforms([])} disabled={running}>
                    清空
                  </button>
                </div>
              </div>
              <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(122px,1fr))', gap: 'var(--s-2)' }}>
                {AI_PLATFORMS.map((p) => {
                  const on = platforms.includes(p.code)
                  return (
                    <button key={p.code} className="checkcard" data-on={on} onClick={() => toggle(p.code)} disabled={running}>
                      <span className="box">
                        <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="var(--on-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1.5 5.2 3.9 7.6 8.5 2.4" />
                        </svg>
                      </span>
                      <span className="truncate">{p.name}</span>
                    </button>
                  )
                })}
              </div>
              <span className="hint">已选 {platforms.length} / 8 个平台 · 平台越多耗时越长，但横向对比更可靠</span>
            </div>

            <button className="btn btn-primary btn-lg" onClick={start} disabled={!canRun} style={{ width: '100%' }}>
              {running ? (
                <>
                  <span
                    style={{
                      width: 14,
                      height: 14,
                      border: '2px solid currentColor',
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                      animation: 'spin 700ms linear infinite',
                      display: 'block',
                    }}
                  />
                  检测进行中…
                </>
              ) : (
                <>
                  <Icon name="play" size={16} />
                  开始体检
                </>
              )}
            </button>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        </section>

        {/* ---- 流水线可视化 ---- */}
        <section className="panel" style={{ alignSelf: 'start' }}>
          <div className="panel-head">
            <div className="panel-title">执行流水线</div>
            {ev && (
              <span className="tag tag-accent num">
                {ev.progress}%
              </span>
            )}
          </div>

          <div className="panel-body col gap-5">
            {/* 进度条 */}
            <div>
              <div style={{ height: 4, background: 'var(--surface-2)', borderRadius: 99, overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${ev?.progress ?? 0}%`,
                    background: 'var(--accent)',
                    borderRadius: 99,
                    transition: 'width 620ms cubic-bezier(0.16,1,0.3,1)',
                  }}
                />
              </div>
              <div className="row-between" style={{ marginTop: 9 }}>
                <span style={{ fontSize: 'var(--t-xs)', color: 'var(--ink-2)' }}>{ev?.detail ?? '等待启动'}</span>
              </div>
            </div>

            {/* 阶段列表 */}
            <div className="col" style={{ gap: 0 }}>
              {STAGE_MAP.map((s, i) => {
                const state = curIdx < 0 ? 'idle' : i < curIdx ? 'done' : i === curIdx ? 'active' : 'idle'
                return (
                  <div key={s.key} className="row" style={{ gap: 14, alignItems: 'stretch', position: 'relative' }}>
                    {/* 时间轴 */}
                    <div className="col" style={{ alignItems: 'center', gap: 0, flex: 'none', width: 30 }}>
                      <div
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: '50%',
                          display: 'grid',
                          placeItems: 'center',
                          flex: 'none',
                          marginTop: 12,
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.66rem',
                          fontWeight: 600,
                          border: '1.5px solid',
                          borderColor: state === 'idle' ? 'var(--line-2)' : 'var(--accent)',
                          background: state === 'done' ? 'var(--accent)' : state === 'active' ? 'var(--accent-soft)' : 'var(--surface)',
                          color: state === 'done' ? 'var(--on-accent)' : state === 'active' ? 'var(--accent-ink)' : 'var(--ink-4)',
                          transition: 'all var(--d-base) var(--e-out)',
                        }}
                      >
                        {state === 'done' ? <Icon name="check" size={14} /> : s.n}
                      </div>
                      {i < STAGE_MAP.length - 1 && (
                        <div
                          style={{
                            width: 1.5,
                            flex: 1,
                            minHeight: 26,
                            background: i < curIdx ? 'var(--accent)' : 'var(--line)',
                            transition: 'background-color var(--d-slow) var(--e-out)',
                          }}
                        />
                      )}
                    </div>

                    <div className="col" style={{ gap: 2, paddingBlock: 12, paddingBottom: i === STAGE_MAP.length - 1 ? 12 : 20 }}>
                      <span
                        className="row"
                        style={{
                          gap: 7,
                          fontSize: 'var(--t-sm)',
                          fontWeight: 600,
                          color: state === 'idle' ? 'var(--ink-4)' : 'var(--ink)',
                          transition: 'color var(--d-base)',
                        }}
                      >
                        {s.title}
                        {state === 'active' && (
                          <i className="dot dot-live" style={{ color: 'var(--accent)' }} />
                        )}
                      </span>
                      <span style={{ fontSize: 'var(--t-2xs)', color: 'var(--ink-3)', lineHeight: 1.6 }}>{s.desc}</span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* 执行日志 */}
            {log.length > 0 && (
              <div
                className="mono"
                style={{
                  background: 'var(--bg-sunk)',
                  border: '1px solid var(--line)',
                  borderRadius: 'var(--r-sm)',
                  padding: 'var(--s-3)',
                  maxHeight: 168,
                  overflowY: 'auto',
                  fontSize: '0.68rem',
                  lineHeight: 1.85,
                  color: 'var(--ink-3)',
                }}
              >
                {log.map((l, i) => (
                  <div key={i} className="fade">
                    <span style={{ color: 'var(--accent)' }}>›</span> {l}
                  </div>
                ))}
              </div>
            )}

            {!running && !ev && (
              <div
                className="col gap-2"
                style={{ padding: 'var(--s-4)', background: 'var(--accent-soft)', borderRadius: 'var(--r-sm)', border: '1px solid color-mix(in oklch, var(--accent) 20%, transparent)' }}
              >
                <span className="row" style={{ gap: 7, fontSize: 'var(--t-xs)', fontWeight: 600, color: 'var(--accent-ink)' }}>
                  <Icon name="info" size={14} />
                  关于数据口径
                </span>
                <p style={{ fontSize: 'var(--t-2xs)', lineHeight: 1.75, color: 'var(--accent-ink)' }}>
                  当前为虚拟推理模式：由算法基于品牌特征生成合理波动的模拟数据，用于验证产品流程与报告形态。
                  接入真实搜索与平台 API 后，报告结构与评分口径完全一致，仅数据来源切换。
                  报告内会标注每项数据是「实测」还是「推演」。
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  )
}
