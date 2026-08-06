import { useEffect, useRef, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Icon } from './Icon'
import type { IconName } from './Icon'
import { relTime, useStore, useTheme } from '../core/store'
import type { ThemeMode } from '../core/store'

const NAV: { to: string; icon: IconName; label: string; hint: string }[] = [
  { to: '/app', icon: 'dashboard', label: '工作台', hint: '全局概览与运营数据' },
  { to: '/app/audit', icon: 'radar', label: 'GEO 体检', hint: '发起检测生成报告' },
  { to: '/app/reports', icon: 'report', label: '报告中心', hint: '历史报告归档' },
  { to: '/app/compose', icon: 'compose', label: '内容中台', hint: '创作与多平台分发' },
  { to: '/app/queue', icon: 'queue', label: '发布队列', hint: '分发状态追踪' },
  { to: '/app/channels', icon: 'plug', label: '渠道管理', hint: '平台授权与健康度' },
  { to: '/app/clients', icon: 'users', label: '客户管理', hint: '品牌档案' },
]

function Logo({ compact }: { compact: boolean }) {
  return (
    <div className="row" style={{ gap: 10, minWidth: 0 }}>
      <svg width="30" height="30" viewBox="0 0 30 30" style={{ flex: 'none' }}>
        <rect width="30" height="30" rx="7" fill="var(--accent)" />
        {/* 胶片齿孔 + 哲唯科技中的方块 */}
        <rect x="5.5" y="6" width="2.4" height="3" rx="0.6" fill="var(--on-accent)" opacity="0.5" />
        <rect x="5.5" y="13.5" width="2.4" height="3" rx="0.6" fill="var(--on-accent)" opacity="0.5" />
        <rect x="5.5" y="21" width="2.4" height="3" rx="0.6" fill="var(--on-accent)" opacity="0.5" />
        <rect x="11" y="7" width="13.5" height="16" rx="1.6" fill="none" stroke="var(--on-accent)" strokeWidth="1.7" />
        <path d="M14 18.5 L17 12.5 L20 16 L22 13.5" stroke="var(--on-accent)" strokeWidth="1.7" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {!compact && (
        <div className="col" style={{ gap: 1, minWidth: 0 }}>
          <span className="display" style={{ fontSize: '1.25rem', lineHeight: 1 }}>
            哲唯科技
          </span>
          <span className="eyebrow" style={{ fontSize: '0.56rem', letterSpacing: '0.18em' }}>
            GEO 交付平台
          </span>
        </div>
      )}
    </div>
  )
}

function ThemeSwitch() {
  const { mode, setMode } = useTheme()
  const opts: { v: ThemeMode; i: IconName; t: string }[] = [
    { v: 'light', i: 'sun', t: '浅色' },
    { v: 'dark', i: 'moon', t: '深色' },
    { v: 'system', i: 'auto', t: '跟随系统' },
  ]
  return (
    <div
      className="row"
      style={{
        gap: 2,
        padding: 2.5,
        background: 'var(--surface-2)',
        border: '1px solid var(--line)',
        borderRadius: 'var(--r-pill)',
      }}
      role="radiogroup"
      aria-label="主题模式"
    >
      {opts.map((o) => (
        <button
          key={o.v}
          role="radio"
          aria-checked={mode === o.v}
          title={o.t}
          onClick={() => setMode(o.v)}
          style={{
            display: 'grid',
            placeItems: 'center',
            width: 26,
            height: 26,
            borderRadius: '50%',
            color: mode === o.v ? 'var(--on-accent)' : 'var(--ink-3)',
            background: mode === o.v ? 'var(--accent)' : 'transparent',
            transition: 'all var(--d-fast) var(--e-out)',
          }}
        >
          <Icon name={o.i} size={14} />
        </button>
      ))}
    </div>
  )
}

function ClientPicker() {
  const { clients, activeClientId, setActiveClientId, activeClient } = useStore()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="row"
        style={{
          gap: 9,
          padding: '5px 10px 5px 7px',
          border: '1px solid var(--line)',
          borderRadius: 'var(--r-sm)',
          background: 'var(--surface)',
          maxWidth: 230,
        }}
      >
        <span
          className="mono"
          style={{
            width: 25,
            height: 25,
            borderRadius: 5,
            background: 'var(--accent-soft)',
            color: 'var(--accent-ink)',
            display: 'grid',
            placeItems: 'center',
            fontSize: '0.7rem',
            fontWeight: 600,
            flex: 'none',
          }}
        >
          {activeClient?.brand.slice(0, 1)}
        </span>
        <span className="col" style={{ gap: 0, alignItems: 'flex-start', minWidth: 0 }}>
          <span style={{ fontSize: 'var(--t-xs)', fontWeight: 600 }} className="truncate">
            {activeClient?.brand}
          </span>
          <span className="muted truncate" style={{ fontSize: 'var(--t-2xs)' }}>
            {activeClient?.category}
          </span>
        </span>
        <span style={{ color: 'var(--ink-4)', flex: 'none', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform var(--d-fast)' }}>
          <Icon name="chevronD" size={13} />
        </span>
      </button>

      {open && (
        <div
          className="fade"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            minWidth: 268,
            background: 'var(--surface-raised)',
            border: '1px solid var(--line-2)',
            borderRadius: 'var(--r-md)',
            boxShadow: 'var(--shadow-lg)',
            padding: 5,
            zIndex: 60,
          }}
        >
          <div className="eyebrow" style={{ padding: '7px 10px 6px' }}>
            切换客户 · 共 {clients.length} 个
          </div>
          {clients.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                setActiveClientId(c.id)
                setOpen(false)
              }}
              className="row"
              style={{
                gap: 9,
                width: '100%',
                padding: '8px 10px',
                borderRadius: 'var(--r-sm)',
                background: c.id === activeClientId ? 'var(--accent-soft)' : 'transparent',
                textAlign: 'left',
              }}
            >
              <span
                className="mono"
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 5,
                  background: c.id === activeClientId ? 'var(--accent)' : 'var(--surface-2)',
                  color: c.id === activeClientId ? 'var(--on-accent)' : 'var(--ink-3)',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  flex: 'none',
                }}
              >
                {c.brand.slice(0, 1)}
              </span>
              <span className="col grow" style={{ gap: 0, minWidth: 0 }}>
                <span style={{ fontSize: 'var(--t-xs)', fontWeight: 500 }} className="truncate">
                  {c.brand}
                </span>
                <span className="muted truncate" style={{ fontSize: 'var(--t-2xs)' }}>
                  {c.name}
                </span>
              </span>
              <span className={`tag tag-${c.status === 'active' ? 'ok' : c.status === 'paused' ? 'warn' : 'neutral'}`}>
                {c.status === 'active' ? '服务中' : c.status === 'paused' ? '暂停' : '流失'}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function AlertBell() {
  const { alerts, markAlertRead, markAllAlertsRead } = useStore()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const unread = alerts.filter((a) => !a.read).length

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button className="btn btn-quiet btn-icon" onClick={() => setOpen((o) => !o)} title="通知" style={{ position: 'relative' }}>
        <Icon name="bell" size={17} />
        {unread > 0 && (
          <span
            className="num"
            style={{
              position: 'absolute',
              top: 1,
              right: 1,
              minWidth: 15,
              height: 15,
              padding: '0 3px',
              borderRadius: 99,
              background: 'var(--danger)',
              color: '#fff',
              fontSize: '0.58rem',
              display: 'grid',
              placeItems: 'center',
              fontWeight: 600,
              lineHeight: 1,
            }}
          >
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div
          className="fade"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            width: 340,
            maxHeight: 420,
            overflowY: 'auto',
            background: 'var(--surface-raised)',
            border: '1px solid var(--line-2)',
            borderRadius: 'var(--r-md)',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 60,
          }}
        >
          <div className="row-between" style={{ padding: '10px 13px', borderBottom: '1px solid var(--line)' }}>
            <span className="eyebrow">通知 · {unread} 条未读</span>
            {unread > 0 && (
              <button className="btn btn-quiet btn-sm" onClick={markAllAlertsRead}>
                全部已读
              </button>
            )}
          </div>
          {alerts.length === 0 && <div className="muted" style={{ padding: 22, textAlign: 'center', fontSize: 'var(--t-sm)' }}>暂无通知</div>}
          {alerts.map((a) => (
            <button
              key={a.id}
              onClick={() => markAlertRead(a.id)}
              className="col"
              style={{
                gap: 4,
                width: '100%',
                padding: '11px 13px',
                borderBottom: '1px solid var(--line)',
                textAlign: 'left',
                background: a.read ? 'transparent' : 'var(--surface-2)',
                alignItems: 'flex-start',
              }}
            >
              <span className="row" style={{ gap: 7 }}>
                <span style={{ color: a.level === 'danger' ? 'var(--danger)' : a.level === 'warn' ? 'var(--warn)' : 'var(--info)', display: 'flex' }}>
                  <Icon name={a.level === 'info' ? 'info' : 'warn'} size={14} />
                </span>
                <b style={{ fontSize: 'var(--t-xs)' }}>{a.title}</b>
                {!a.read && <i className="dot" style={{ color: 'var(--accent)' }} />}
              </span>
              <span className="muted" style={{ fontSize: 'var(--t-2xs)', lineHeight: 1.6 }}>
                {a.detail}
              </span>
              <span className="muted" style={{ fontSize: 'var(--t-2xs)' }}>
                {relTime(a.at)}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function Shell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('xy.rail') === '1')
  const [mobileOpen, setMobileOpen] = useState(false)
  const loc = useLocation()

  useEffect(() => localStorage.setItem('xy.rail', collapsed ? '1' : '0'), [collapsed])
  useEffect(() => setMobileOpen(false), [loc.pathname])

  return (
    <div className="shell" data-collapsed={collapsed} data-mobile-open={mobileOpen}>
      {/* 侧边导航 */}
      <aside className="rail">
        <div className="rail-top">
          <Logo compact={collapsed} />
          <button className="btn btn-quiet btn-icon rail-toggle" onClick={() => setCollapsed((c) => !c)} title={collapsed ? '展开' : '收起'}>
            <Icon name="menu" size={16} />
          </button>
        </div>

        <nav className="rail-nav">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.to === '/'} className={({ isActive }) => `rail-item${isActive ? ' on' : ''}`} title={collapsed ? n.label : n.hint}>
              <span className="rail-ico">
                <Icon name={n.icon} size={18} />
              </span>
              {!collapsed && (
                <span className="col grow" style={{ gap: 0, minWidth: 0, alignItems: 'flex-start' }}>
                  <span className="rail-label">{n.label}</span>
                  <span className="rail-hint">{n.hint}</span>
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {!collapsed && (
          <div className="rail-foot">
            <div className="sprockets" style={{ marginBottom: 10 }}>
              {Array.from({ length: 9 }, (_, i) => (
                <i key={i} />
              ))}
            </div>
            <p className="muted" style={{ fontSize: 'var(--t-2xs)', lineHeight: 1.65 }}>
              实时联网 · 数据来自真实爬取与平台接口。
              <br />
              后端服务运行中即可完整投产。
            </p>
          </div>
        )}
      </aside>

      <div className="scrim" onClick={() => setMobileOpen(false)} />

      {/* 主区 */}
      <div className="main">
        <header className="topbar">
          <button className="btn btn-quiet btn-icon mobile-only" onClick={() => setMobileOpen(true)} title="菜单">
            <Icon name="menu" size={18} />
          </button>
          <ClientPicker />
          <div className="grow" />
          <AlertBell />
          <ThemeSwitch />
        </header>
        <main className="content">{children}</main>
      </div>
    </div>
  )
}
