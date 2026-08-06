import { useMemo, useState } from 'react'
import { Icon } from '../ui/Icon'
import { CHANNELS } from '../core/channels'
import type { AuthMethod, ChannelAccount, ChannelKind } from '../core/types'
import { fmtDate, relTime, useStore } from '../core/store'
import { getConnector } from '../core/connector'

const kindLabel = (k: ChannelKind) => (k === 'article' ? '图文' : k === 'video' ? '视频' : '图文+视频')
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

function daysUntil(iso?: string) {
  if (!iso) return null
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000)
}

function healthBadge(acc?: ChannelAccount) {
  if (!acc || acc.health === 'off' || !acc.connected) return { cls: 'tag-neutral', text: '未连接' }
  if (acc.health === 'ok') return { cls: 'tag-ok', text: '正常', icon: 'check' as const }
  if (acc.health === 'expiring') {
    const d = daysUntil(acc.expiresAt)
    return { cls: 'tag-warn', text: d !== null ? `${d} 天后过期` : '即将过期', icon: 'warn' as const }
  }
  return { cls: 'tag-danger', text: '授权失效', icon: 'warn' as const }
}

const METHOD_META: { key: AuthMethod; label: string; hint: string; placeholder: string }[] = [
  { key: 'oauth', label: 'OAuth 授权', hint: '跳转平台授权页，最安全，无需经手密钥', placeholder: '' },
  { key: 'apikey', label: 'API Key', hint: '填写平台开放接口密钥，服务端代发', placeholder: '粘贴 API Key / Access Token' },
  { key: 'cookie', label: 'Cookie / 会话', hint: '适用于未开放 API 的平台，演示谨慎使用', placeholder: '粘贴登录态 Cookie' },
]

export default function Channels() {
  const { accounts, activeClient, activeClientId, connectAccount, disconnectAccount, refreshAccount } = useStore()
  const [confirmAll, setConfirmAll] = useState(false)

  // 绑定弹层状态
  const [bindCode, setBindCode] = useState<string | null>(null)
  const [method, setMethod] = useState<AuthMethod>('oauth')
  const [cred, setCred] = useState('')
  const [busy, setBusy] = useState(false)
  const [step, setStep] = useState<'form' | 'authorizing' | 'done'>('form')
  const [err, setErr] = useState<string | null>(null)

  const myAccounts = useMemo(() => {
    const map = new Map<string, ChannelAccount>()
    for (const a of accounts) if (a.clientId === activeClientId) map.set(a.code, a)
    return map
  }, [accounts, activeClientId])

  const connected = CHANNELS.filter((c) => myAccounts.get(c.code)?.connected).length
  const weighted = CHANNELS.filter((c) => myAccounts.get(c.code)?.connected).reduce((s, c) => s + c.caps.geoWeight, 0)
  const maxWeight = CHANNELS.reduce((s, c) => s + c.caps.geoWeight, 0)
  const coverage = Math.round((weighted / maxWeight) * 100)

  const connectAll = async () => {
    const conn = getConnector(activeClientId)
    for (const c of CHANNELS) {
      const acc = myAccounts.get(c.code)
      if (acc?.connected) continue
      const r = await conn.connect(c.code, 'oauth')
      if (r.ok) {
        connectAccount(activeClientId, c.code, {
          authMethod: 'oauth',
          accountName: r.accountName,
          expiresAt: r.expiresAt,
          scopes: r.scopes,
          connectedAt: r.connectedAt,
        })
      }
    }
    setConfirmAll(false)
  }

  const openBind = (code: string) => {
    setBindCode(code)
    setMethod('oauth')
    setCred('')
    setStep('form')
    setBusy(false)
    setErr(null)
  }

  const doConnect = async () => {
    if (!bindCode) return
    const conn = getConnector(activeClientId)
    setBusy(true)
    setErr(null)
    try {
      if (method === 'oauth') {
        setStep('authorizing')
        const auth = await conn.authorize(bindCode, 'oauth')
        if (auth.authUrl && !auth.authUrl.startsWith('#')) {
          window.location.href = auth.authUrl
          return
        }
        await sleep(360)
        const res = await conn.connect(bindCode, 'oauth')
        if (res.ok) {
          connectAccount(activeClientId, bindCode, {
            authMethod: 'oauth',
            accountName: res.accountName,
            expiresAt: res.expiresAt,
            scopes: res.scopes,
            connectedAt: res.connectedAt,
          })
          setStep('done')
        } else setErr(res.error || '授权失败')
      } else {
        const res = await conn.connect(bindCode, method, cred)
        if (res.ok) {
          connectAccount(activeClientId, bindCode, {
            authMethod: method,
            credential: cred,
            accountName: res.accountName,
            expiresAt: res.expiresAt,
            scopes: res.scopes,
            connectedAt: res.connectedAt,
          })
          setStep('done')
        } else setErr(res.error || '连接失败')
      }
    } catch (e) {
      setErr(String(e))
    }
    setBusy(false)
  }

  const strip = [
    { l: '已连渠道', v: connected, total: CHANNELS.length, icon: 'plug' as const, c: 'var(--accent)' },
    { l: 'GEO 覆盖度', v: coverage, suffix: '%', icon: 'target' as const, c: 'var(--ok)' },
    { l: '待续期', v: CHANNELS.filter((c) => myAccounts.get(c.code)?.health === 'expiring').length, icon: 'clock' as const, c: 'var(--warn)' },
    { l: '异常', v: CHANNELS.filter((c) => myAccounts.get(c.code)?.health === 'error').length, icon: 'warn' as const, c: 'var(--danger)' },
  ]

  const bindChannel = bindCode ? CHANNELS.find((c) => c.code === bindCode) : null

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow" style={{ marginBottom: 9 }}>
            渠道管理 · {activeClient?.brand}
          </div>
          <h1 className="page-title">把内容投到哪</h1>
          <p className="page-sub">
            连接各平台账号后，内容中台即可一键分发。支持 OAuth / API Key / Cookie 三种授权方式，凭证存于本地浏览器（演示环境）。
            渠道的 GEO 权重越高，对 AI 可见度的贡献越大。
          </p>
        </div>
        <div className="row gap-2">
          <button className="btn btn-ghost" onClick={() => setConfirmAll(true)} disabled={connected === CHANNELS.length}>
            <Icon name="link" size={15} />
            全部连接
          </button>
          <button className="btn btn-quiet" onClick={() => CHANNELS.forEach((c) => disconnectAccount(activeClientId, c.code))} disabled={connected === 0}>
            全部断开
          </button>
        </div>
      </div>

      <div className="kpi-strip rise" style={{ marginBottom: 'var(--s-5)' }}>
        {strip.map((k) => (
          <div className="kpi" key={k.l}>
            <div className="row-between">
              <span className="eyebrow">{k.l}</span>
              <span style={{ color: 'var(--ink-4)', display: 'flex' }}>
                <Icon name={k.icon} size={14} />
              </span>
            </div>
            <div className="kpi-val" style={{ color: k.v > 0 ? k.c : undefined }}>
              {k.v}
              {k.total ? <span style={{ fontSize: '0.5em', marginLeft: 4, color: 'var(--ink-3)' }}>/{k.total}</span> : k.suffix ? <span style={{ fontSize: '0.5em', marginLeft: 4, color: 'var(--ink-3)' }}>{k.suffix}</span> : null}
            </div>
          </div>
        ))}
      </div>

      <div className="grid g-auto" style={{ gap: 'var(--s-4)' }}>
        {CHANNELS.map((c) => {
          const acc = myAccounts.get(c.code)
          const on = !!acc?.connected
          const hb = healthBadge(acc)
          const gw = c.caps.geoWeight
          const gwColor = gw >= 85 ? 'var(--ok)' : gw >= 70 ? 'var(--warn)' : 'var(--ink-3)'
          return (
            <div key={c.code} className="panel col gap-3" style={{ padding: 'var(--s-4)' }}>
              <div className="row-between" style={{ alignItems: 'flex-start' }}>
                <div className="row gap-3" style={{ minWidth: 0 }}>
                  <span style={{ width: 30, height: 30, borderRadius: 8, background: c.hue, flex: 'none', display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 700, fontSize: '0.8rem' }}>
                    {c.name.slice(0, 1)}
                  </span>
                  <div className="col" style={{ gap: 2, minWidth: 0 }}>
                    <b className="truncate" style={{ fontSize: 'var(--t-sm)', color: 'var(--ink)' }}>
                      {c.name}
                    </b>
                    <span className="tag tag-neutral" style={{ fontSize: '0.6rem', alignSelf: 'flex-start', background: 'var(--surface-2)' }}>
                      {kindLabel(c.kind)}
                    </span>
                  </div>
                </div>
                <span className={`tag ${hb.cls}`}>
                  {hb.icon && <Icon name={hb.icon} size={11} />}
                  {hb.text}
                </span>
              </div>

              <p className="muted" style={{ fontSize: 'var(--t-2xs)', lineHeight: 1.6, minHeight: 32 }}>
                {c.tip}
              </p>

              <div>
                <div className="row-between" style={{ marginBottom: 5 }}>
                  <span className="eyebrow" style={{ fontSize: '0.6rem' }}>
                    GEO 权重
                  </span>
                  <b className="num" style={{ fontSize: 'var(--t-xs)', color: gwColor }}>
                    {gw}
                  </b>
                </div>
                <div style={{ height: 5, background: 'var(--surface-2)', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${gw}%`, background: gwColor, borderRadius: 99, transition: 'width 1s var(--e-out)' }} />
                </div>
              </div>

              <div className="row wrap gap-2">
                {c.caps.cover && <span className="tag tag-neutral" style={{ fontSize: '0.6rem' }}>封面</span>}
                {c.caps.tags && <span className="tag tag-neutral" style={{ fontSize: '0.6rem' }}>标签</span>}
                {c.caps.schedule && <span className="tag tag-neutral" style={{ fontSize: '0.6rem' }}>定时</span>}
                <span className="tag tag-neutral" style={{ fontSize: '0.6rem' }}>正文 {c.bodyLimit >= 10000 ? '不限' : c.bodyLimit}</span>
              </div>

              {/* 连接控制区 */}
              <div className="row-between" style={{ paddingTop: 'var(--s-3)', borderTop: '1px solid var(--line)', gap: 'var(--s-3)' }}>
                <div className="col" style={{ gap: 2, minWidth: 0 }}>
                  {on ? (
                    <>
                      <span className="truncate" style={{ fontSize: 'var(--t-2xs)', color: 'var(--ink-2)' }}>
                        {acc?.accountName ?? '已授权账号'}
                        {acc?.authMethod && <span className="muted"> · {acc.authMethod === 'oauth' ? 'OAuth' : acc.authMethod === 'apikey' ? 'API Key' : 'Cookie'}</span>}
                      </span>
                      <span className="muted" style={{ fontSize: '0.62rem' }}>
                        {acc?.lastSync ? `同步 ${relTime(acc.lastSync)}` : ''}
                        {acc?.expiresAt ? ` · ${fmtDate(acc.expiresAt)} 到期` : ''}
                      </span>
                    </>
                  ) : (
                    <span className="muted" style={{ fontSize: 'var(--t-2xs)' }}>未授权 · 内容分发将跳过</span>
                  )}
                </div>

                {on ? (
                  <div className="row gap-2">
                    <button className="btn btn-quiet btn-sm" title="刷新授权" onClick={() => refreshAccount(activeClientId, c.code)}>
                      <Icon name="refresh" size={13} />
                    </button>
                    <button className="btn btn-quiet btn-sm" title="断开" onClick={() => disconnectAccount(activeClientId, c.code)}>
                      <Icon name="unlink" size={13} />
                    </button>
                  </div>
                ) : (
                  <button className="btn btn-primary btn-sm" onClick={() => openBind(c.code)}>
                    <Icon name="link" size={13} />
                    绑定
                  </button>
                )}
              </div>

              {/* 已连接：授权范围 */}
              {on && acc?.scopes && acc.scopes.length > 0 && (
                <div className="row wrap gap-2" style={{ marginTop: 'var(--s-2)' }}>
                  {acc.scopes.map((s) => (
                    <span key={s} className="tag tag-accent" style={{ fontSize: '0.58rem' }}>
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* 弹层：确认全连 */}
      {confirmAll && (
        <div className="overlay" onClick={() => setConfirmAll(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="panel-head">
              <div className="panel-title">确认连接全部渠道</div>
              <button className="btn btn-quiet btn-icon" onClick={() => setConfirmAll(false)}>
                <Icon name="x" size={16} />
              </button>
            </div>
            <div className="panel-body col gap-4" style={{ padding: 'var(--s-5)' }}>
              <p style={{ fontSize: 'var(--t-sm)', lineHeight: 1.75, color: 'var(--ink-2)' }}>
                将为 <b>{activeClient?.brand}</b> 一次性连接全部 {CHANNELS.length} 个平台（演示环境以 OAuth 模拟授权，不调用真实接口）。正式投产时每个平台会跳转对应授权页。
              </p>
              <div className="row gap-2" style={{ justifyContent: 'flex-end' }}>
                <button className="btn btn-ghost" onClick={() => setConfirmAll(false)}>
                  取消
                </button>
                <button className="btn btn-primary" onClick={connectAll}>
                  <Icon name="link" size={15} />
                  确认连接
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 弹层：绑定配置 */}
      {bindChannel && (
        <div className="overlay" onClick={() => step === 'done' && setBindCode(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <div className="panel-head">
              <div className="panel-title row gap-2">
                <span style={{ width: 22, height: 22, borderRadius: 6, background: bindChannel.hue, display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 700, fontSize: '0.7rem' }}>
                  {bindChannel.name.slice(0, 1)}
                </span>
                绑定 {bindChannel.name}
              </div>
              <button className="btn btn-quiet btn-icon" onClick={() => setBindCode(null)}>
                <Icon name="x" size={16} />
              </button>
            </div>

            <div className="panel-body col gap-5" style={{ padding: 'var(--s-5)' }}>
              {step === 'form' && (
                <>
                  <div className="field">
                    <label className="label">授权方式</label>
                    <div className="grid g-3" style={{ gap: 'var(--s-2)' }}>
                      {METHOD_META.map((m) => (
                        <button key={m.key} className="checkcard" data-on={method === m.key} onClick={() => setMethod(m.key)} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 4, padding: 'var(--s-3)' }}>
                          <span className="row gap-2" style={{ width: '100%' }}>
                            <span className="box">
                              <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="var(--on-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M1.5 5.2 3.9 7.6 8.5 2.4" />
                              </svg>
                            </span>
                            <b style={{ fontSize: 'var(--t-xs)' }}>{m.label}</b>
                          </span>
                        </button>
                      ))}
                    </div>
                    <span className="hint">{METHOD_META.find((m) => m.key === method)?.hint}</span>
                  </div>

                  {method !== 'oauth' ? (
                    <div className="field">
                      <label className="label">{method === 'apikey' ? 'API Key' : 'Cookie / 会话'}</label>
                      <input className="input" type="password" value={cred} onChange={(e) => setCred(e.target.value)} placeholder={METHOD_META.find((m) => m.key === method)?.placeholder} />
                      <span className="hint">演示环境明文存于本地浏览器；正式环境密钥应由后端托管，前端仅持短期 token。</span>
                    </div>
                  ) : (
                    <div className="callout" data-tone="accent">
                      <div className="callout-h">
                        <Icon name="shield" size={14} />
                        OAuth 授权流程
                      </div>
                      <p style={{ fontSize: 'var(--t-2xs)', lineHeight: 1.75 }}>
                        点击「前往授权」将跳转 {bindChannel.name} 授权页（演示为模拟回调）。授权后平台会回传短期 Access Token 与刷新令牌，由后端安全托管。
                      </p>
                    </div>
                  )}

                  {err && <div className="callout" data-tone="danger"><p style={{ fontSize: 'var(--t-2xs)' }}>{err}</p></div>}

                  <div className="row gap-2" style={{ justifyContent: 'flex-end' }}>
                    <button className="btn btn-ghost" onClick={() => setBindCode(null)}>
                      取消
                    </button>
                    <button className="btn btn-primary" onClick={doConnect} disabled={busy || (method !== 'oauth' && !cred.trim())}>
                      {method === 'oauth' ? (
                        <>
                          <Icon name="external" size={14} />
                          前往授权
                        </>
                      ) : (
                        <>
                          <Icon name="link" size={14} />
                          完成连接
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}

              {step === 'authorizing' && (
                <div className="col gap-4" style={{ alignItems: 'center', paddingBlock: 'var(--s-7)' }}>
                  <span style={{ width: 38, height: 38, border: '3px solid var(--line-2)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 700ms linear infinite', display: 'block' }} />
                  <b style={{ fontSize: 'var(--t-sm)' }}>正在跳转授权并回传令牌…</b>
                  <p className="muted" style={{ fontSize: 'var(--t-2xs)', textAlign: 'center' }}>模拟 {bindChannel.name} OAuth 回调，请勿关闭</p>
                  <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                </div>
              )}

              {step === 'done' && (
                <div className="col gap-4" style={{ alignItems: 'center', paddingBlock: 'var(--s-6)' }}>
                  <span style={{ width: 46, height: 46, borderRadius: '50%', background: 'var(--ok)', display: 'grid', placeItems: 'center', color: '#fff' }}>
                    <Icon name="check" size={22} />
                  </span>
                  <b style={{ fontSize: 'var(--t-md)' }}>已连接 {bindChannel.name}</b>
                  <p className="muted" style={{ fontSize: 'var(--t-2xs)', textAlign: 'center' }}>
                    授权成功，内容中台现在可以向该平台分发。下次到期前可在此刷新或断开。
                  </p>
                  <button className="btn btn-primary" onClick={() => setBindCode(null)}>
                    完成
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="row gap-2 muted" style={{ marginTop: 'var(--s-5)', justifyContent: 'center', fontSize: 'var(--t-2xs)' }}>
        <Icon name="info" size={13} />
        后端在线时：OAuth 走平台授权跳转、API Key/Cookie 由后端登记；后端离线时自动回退沙箱模拟授权。
      </div>
    </>
  )
}
