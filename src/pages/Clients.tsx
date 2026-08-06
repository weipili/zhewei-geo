import { useMemo, useState } from 'react'
import { Icon } from '../ui/Icon'
import type { Client } from '../core/types'
import { fmtDate, newId, useStore } from '../core/store'

const PLANS: { v: Client['plan']; t: string }[] = [
  { v: 'trial', t: '试用' },
  { v: 'basic', t: '基础版' },
  { v: 'pro', t: '专业版' },
  { v: 'enterprise', t: '企业版' },
]
const STATUSES: { v: Client['status']; t: string; cls: string }[] = [
  { v: 'active', t: '服务中', cls: 'tag-ok' },
  { v: 'paused', t: '暂停', cls: 'tag-warn' },
  { v: 'churned', t: '流失', cls: 'tag-neutral' },
]

const emptyForm = (): Client => ({
  id: newId('c'),
  name: '',
  brand: '',
  category: '',
  industry: '',
  contact: '',
  phone: '',
  website: '',
  plan: 'trial',
  status: 'active',
  createdAt: new Date().toISOString(),
  note: '',
})

export default function Clients() {
  const { clients, accounts, contents, audits, activeClientId, setActiveClientId, upsertClient, removeClient } = useStore()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<Client>(emptyForm())
  const [toRemove, setToRemove] = useState<Client | null>(null)

  const stats = useMemo(() => {
    const map = new Map<string, { audits: number; done: number; contents: number; channels: number }>()
    for (const c of clients) {
      const myAudits = audits.filter((a) => a.clientId === c.id)
      map.set(c.id, {
        audits: myAudits.length,
        done: myAudits.filter((a) => a.phase === 'done').length,
        contents: contents.filter((x) => x.clientId === c.id).length,
        channels: accounts.filter((a) => a.clientId === c.id && a.connected).length,
      })
    }
    return map
  }, [clients, audits, contents, accounts])

  const openAdd = () => {
    setForm(emptyForm())
    setOpen(true)
  }
  const openEdit = (c: Client) => {
    setForm({ ...c })
    setOpen(true)
  }
  const save = () => {
    if (!form.brand.trim() || !form.name.trim() || !form.category.trim()) return
    upsertClient({ ...form, brand: form.brand.trim(), name: form.name.trim(), category: form.category.trim() })
    setOpen(false)
  }
  const doRemove = () => {
    if (toRemove) removeClient(toRemove.id)
    setToRemove(null)
  }

  const totalContents = contents.length
  const totalConnected = clients.reduce((s, c) => s + (stats.get(c.id)?.channels ?? 0), 0)
  const strip = [
    { l: '客户总数', v: clients.length, icon: 'users' as const },
 { l: '服务中', v: clients.filter((c) => c.status === 'active').length, icon: 'check' as const },
    { l: '内容总数', v: totalContents, icon: 'doc' as const },
    { l: '已连渠道', v: totalConnected, icon: 'plug' as const },
  ]

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow" style={{ marginBottom: 9 }}>
            客户管理 · 品牌档案
          </div>
          <h1 className="page-title">为谁交付结果</h1>
          <p className="page-sub">
            每个客户对应一套品牌档案与独立的内容、渠道、体检数据。切换顶栏客户即可在不同品牌的工作台间切换。
          </p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Icon name="plus" size={15} />
          新增客户
        </button>
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
            <div className="kpi-val">{k.v}</div>
          </div>
        ))}
      </div>

      <div className="grid g-auto" style={{ gap: 'var(--s-4)' }}>
        {clients.map((c) => {
          const st = stats.get(c.id)
          const isActive = c.id === activeClientId
          const plan = PLANS.find((p) => p.v === c.plan)
          const status = STATUSES.find((s) => s.v === c.status)
          return (
            <div key={c.id} className="panel col gap-3" style={{ padding: 'var(--s-5)', outline: isActive ? '1.5px solid var(--accent)' : 'none' }}>
              <div className="row-between" style={{ alignItems: 'flex-start' }}>
                <div className="row gap-3" style={{ minWidth: 0 }}>
                  <span className="mono" style={{ width: 38, height: 38, borderRadius: 9, background: 'var(--accent-soft)', color: 'var(--accent-ink)', display: 'grid', placeItems: 'center', fontSize: '1rem', fontWeight: 600, flex: 'none' }}>
                    {c.brand.slice(0, 1)}
                  </span>
                  <div className="col" style={{ gap: 2, minWidth: 0 }}>
                    <b className="truncate" style={{ fontSize: 'var(--t-md)', color: 'var(--ink)' }}>
                      {c.brand}
                    </b>
                    <span className="muted truncate" style={{ fontSize: 'var(--t-2xs)' }}>
                      {c.name}
                    </span>
                  </div>
                </div>
                {status && <span className={`tag ${status.cls}`}>{status.t}</span>}
              </div>

              <div className="row wrap gap-2">
                <span className="tag tag-accent">{plan?.t}</span>
                <span className="tag tag-neutral">{c.category}</span>
                {c.industry && <span className="tag tag-neutral">{c.industry}</span>}
              </div>

              {c.website && (
                <div className="row gap-2 muted" style={{ fontSize: 'var(--t-2xs)' }}>
                  <Icon name="link" size={12} />
                  <span className="truncate">{c.website}</span>
                </div>
              )}
              {c.contact && (
                <div className="row gap-2 muted" style={{ fontSize: 'var(--t-2xs)' }}>
                  <Icon name="users" size={12} />
                  <span>
                    {c.contact}
                    {c.phone ? ` · ${c.phone}` : ''}
                  </span>
                </div>
              )}

              {/* 统计 */}
              <div className="grid g-3" style={{ gap: 'var(--s-2)', paddingTop: 'var(--s-3)', borderTop: '1px solid var(--line)' }}>
                {[
                  { l: '报告', v: st?.done ?? 0 },
                  { l: '内容', v: st?.contents ?? 0 },
                  { l: '渠道', v: st?.channels ?? 0 },
                ].map((x) => (
                  <div key={x.l} className="col" style={{ gap: 2, padding: '6px 9px', background: 'var(--surface-2)', borderRadius: 'var(--r-xs)' }}>
                    <b className="num" style={{ fontSize: 'var(--t-md)', lineHeight: 1, color: 'var(--ink)' }}>
                      {x.v}
                    </b>
                    <span style={{ fontSize: '0.62rem', color: 'var(--ink-3)' }}>{x.l}</span>
                  </div>
                ))}
              </div>

              <div className="row-between" style={{ gap: 'var(--s-2)', paddingTop: 4 }}>
                <span className="muted" style={{ fontSize: '0.62rem' }}>
                  入库 {fmtDate(c.createdAt)}
                </span>
                <div className="row gap-2">
                  {!isActive && (
                    <button className="btn btn-quiet btn-sm" onClick={() => setActiveClientId(c.id)} title="切换为当前客户">
                      设为当前
                    </button>
                  )}
                  {isActive && (
                    <span className="tag tag-accent" style={{ fontSize: '0.6rem' }}>
                      当前
                    </span>
                  )}
                  <button className="btn btn-quiet btn-sm" onClick={() => openEdit(c)}>
                    <Icon name="edit" size={13} />
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => setToRemove(c)}>
                    <Icon name="trash" size={13} />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* 编辑弹层 */}
      {open && (
        <div className="overlay" onClick={() => setOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="panel-head">
              <div className="panel-title">{form.createdAt && clients.find((c) => c.id === form.id) ? '编辑客户' : '新增客户'}</div>
              <button className="btn btn-quiet btn-icon" onClick={() => setOpen(false)}>
                <Icon name="x" size={16} />
              </button>
            </div>
            <div className="panel-body col gap-4" style={{ padding: 'var(--s-5)', maxHeight: '70dvh', overflowY: 'auto' }}>
              <div className="grid g-2" style={{ gap: 'var(--s-4)' }}>
                <div className="field">
                  <label className="label">
                    品牌名称 <span className="req">*</span>
                  </label>
                  <input className="input" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} placeholder="如：哲唯科技" />
                </div>
                <div className="field">
                  <label className="label">
                    公司全称 <span className="req">*</span>
                  </label>
                  <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="如：安徽哲唯电子科技有限公司" />
                </div>
              </div>

              <div className="grid g-2" style={{ gap: 'var(--s-4)' }}>
                <div className="field">
                  <label className="label">
                    经营品类 <span className="req">*</span>
                  </label>
                  <input className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="如：电脑IT硬件" />
                </div>
                <div className="field">
                  <label className="label">所属行业</label>
                  <input className="input" value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} placeholder="如：IT硬件与服务" />
                </div>
              </div>

              <div className="field">
                <label className="label">官网地址</label>
                <input className="input" value={form.website ?? ''} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://" />
                <span className="hint">有官网可显著提升该客户 GEO 体检的「基建」维度得分</span>
              </div>

              <div className="grid g-2" style={{ gap: 'var(--s-4)' }}>
                <div className="field">
                  <label className="label">联系人</label>
                  <input className="input" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} placeholder="如：王亚梅" />
                </div>
                <div className="field">
                  <label className="label">联系电话</label>
                  <input className="input" value={form.phone ?? ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="选填" />
                </div>
              </div>

              <div className="grid g-2" style={{ gap: 'var(--s-4)' }}>
                <div className="field">
                  <label className="label">套餐</label>
                  <select className="select" value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value as Client['plan'] })}>
                    {PLANS.map((p) => (
                      <option key={p.v} value={p.v}>
                        {p.t}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label className="label">服务状态</label>
                  <select className="select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Client['status'] })}>
                    {STATUSES.map((s) => (
                      <option key={s.v} value={s.v}>
                        {s.t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="field">
                <label className="label">备注</label>
                <textarea className="textarea" value={form.note ?? ''} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="选填：客户背景、运营目标、注意事项…" style={{ minHeight: 70 }} />
              </div>

              <div className="row gap-2" style={{ justifyContent: 'flex-end' }}>
                <button className="btn btn-ghost" onClick={() => setOpen(false)}>
                  取消
                </button>
                <button className="btn btn-primary" onClick={save} disabled={!form.brand.trim() || !form.name.trim() || !form.category.trim()}>
                  <Icon name="check" size={15} />
                  保存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认 */}
      {toRemove && (
        <div className="overlay" onClick={() => setToRemove(null)}>
          <div className="modal" style={{ width: 'min(440px,100%)' }} onClick={(e) => e.stopPropagation()}>
            <div className="panel-body col gap-4" style={{ padding: 'var(--s-5)' }}>
              <div className="row gap-3">
                <span style={{ color: 'var(--danger)', display: 'flex', flex: 'none' }}>
                  <Icon name="trash" size={22} />
                </span>
                <div className="col gap-2">
                  <b style={{ fontSize: 'var(--t-md)' }}>删除客户「{toRemove.brand}」？</b>
                  <p className="muted" style={{ fontSize: 'var(--t-sm)', lineHeight: 1.7 }}>
                    将一并移除该客户下的 {stats.get(toRemove.id)?.contents ?? 0} 篇内容、
                    {stats.get(toRemove.id)?.done ?? 0} 份体检报告与全部渠道连接，且不可恢复。
                  </p>
                </div>
              </div>
              <div className="row gap-2" style={{ justifyContent: 'flex-end' }}>
                <button className="btn btn-ghost" onClick={() => setToRemove(null)}>
                  取消
                </button>
                <button className="btn btn-danger" onClick={doRemove}>
                  <Icon name="trash" size={14} />
                  确认删除
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
