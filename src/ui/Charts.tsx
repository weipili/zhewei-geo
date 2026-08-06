/* ============================================================
   手绘 SVG 图表组件集
   全部使用 currentColor / CSS 变量，自动跟随明暗主题
   ============================================================ */

import { useEffect, useId, useRef, useState } from 'react'

/* ---------- 数字滚动动画 ---------- */
export function Counter({ value, decimals = 0, suffix = '' }: { value: number; decimals?: number; suffix?: string }) {
  const [v, setV] = useState(0)
  const ref = useRef(0)
  useEffect(() => {
    const from = ref.current
    const start = performance.now()
    const dur = 900
    let raf = 0
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / dur)
      const eased = 1 - Math.pow(1 - p, 4)
      const cur = from + (value - from) * eased
      setV(cur)
      if (p < 1) raf = requestAnimationFrame(step)
      else ref.current = value
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [value])
  return (
    <span className="num">
      {v.toFixed(decimals)}
      {suffix}
    </span>
  )
}

/* ---------- 环形评分表（仪器刻度盘） ---------- */
export function ScoreDial({ score, size = 190, label = 'AIVO' }: { score: number; size?: number; label?: string }) {
  const r = size / 2
  const stroke = 9
  const radius = r - stroke * 1.9
  const circ = 2 * Math.PI * radius
  const [anim, setAnim] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setAnim(score), 120)
    return () => clearTimeout(t)
  }, [score])

  const tone = score >= 90 ? 'var(--ok)' : score >= 75 ? 'var(--accent)' : score >= 60 ? 'var(--warn)' : 'var(--danger)'
  const grade = score >= 90 ? '优秀' : score >= 75 ? '良好' : score >= 60 ? '一般' : '较差'

  // 刻度线
  const ticks = Array.from({ length: 44 }, (_, i) => {
    const a = (i / 44) * 2 * Math.PI - Math.PI / 2
    const inner = radius + stroke * 0.95
    const outer = inner + (i % 11 === 0 ? 7 : 3.4)
    return {
      x1: r + Math.cos(a) * inner,
      y1: r + Math.sin(a) * inner,
      x2: r + Math.cos(a) * outer,
      y2: r + Math.sin(a) * outer,
      major: i % 11 === 0,
    }
  })

  return (
    <div style={{ position: 'relative', width: size, height: size, flex: 'none' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {ticks.map((t, i) => (
          <line
            key={i}
            x1={t.x1}
            y1={t.y1}
            x2={t.x2}
            y2={t.y2}
            stroke={t.major ? 'var(--line-strong)' : 'var(--line)'}
            strokeWidth={t.major ? 1.5 : 1}
            strokeLinecap="round"
          />
        ))}
        <circle cx={r} cy={r} r={radius} fill="none" stroke="var(--line)" strokeWidth={stroke} />
        <circle
          cx={r}
          cy={r}
          r={radius}
          fill="none"
          stroke={tone}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ - (circ * anim) / 100}
          transform={`rotate(-90 ${r} ${r})`}
          style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.16,1,0.3,1)' }}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'grid',
          placeItems: 'center',
          textAlign: 'center',
          lineHeight: 1,
        }}
      >
        <div>
          <div className="eyebrow" style={{ marginBottom: 8 }}>
            {label}
          </div>
          <div
            className="num"
            style={{ fontSize: size * 0.29, fontWeight: 600, color: tone, letterSpacing: '-0.04em' }}
          >
            <Counter value={score} />
          </div>
          <div style={{ fontSize: 'var(--t-xs)', color: 'var(--ink-3)', marginTop: 9 }}>{grade}</div>
        </div>
      </div>
    </div>
  )
}

/* ---------- 折线 / 面积图 ---------- */
export interface LineSeries {
  name: string
  color: string
  data: number[]
}

export function LineChart({
  labels,
  series,
  height = 220,
  area = true,
  suffix = '',
}: {
  labels: string[]
  series: LineSeries[]
  height?: number
  area?: boolean
  suffix?: string
}) {
  const uid = useId().replace(/:/g, '')
  const [hover, setHover] = useState<number | null>(null)
  const w = 720
  const h = height
  const padL = 46
  const padR = 14
  const padT = 16
  const padB = 28

  const all = series.flatMap((s) => s.data)
  const rawMax = Math.max(...all, 1)
  const max = rawMax * 1.12
  const min = 0
  const iw = w - padL - padR
  const ih = h - padT - padB

  const xOf = (i: number) => padL + (labels.length <= 1 ? iw / 2 : (i / (labels.length - 1)) * iw)
  const yOf = (v: number) => padT + ih - ((v - min) / (max - min)) * ih

  const gridVals = Array.from({ length: 5 }, (_, i) => min + ((max - min) / 4) * i)

  const pathOf = (data: number[]) => data.map((v, i) => `${i === 0 ? 'M' : 'L'}${xOf(i)},${yOf(v)}`).join(' ')
  const areaOf = (data: number[]) => `${pathOf(data)} L${xOf(data.length - 1)},${padT + ih} L${xOf(0)},${padT + ih} Z`

  const fmtTick = (v: number) => (v >= 10000 ? (v / 10000).toFixed(1) + '万' : Math.round(v).toString())

  return (
    <div style={{ position: 'relative' }}>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        style={{ width: '100%', height: 'auto', overflow: 'visible' }}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          {series.map((s, si) => (
            <linearGradient key={si} id={`${uid}-g${si}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity="0.22" />
              <stop offset="100%" stopColor={s.color} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>

        {gridVals.map((v, i) => (
          <g key={i}>
            <line x1={padL} y1={yOf(v)} x2={w - padR} y2={yOf(v)} stroke="var(--line)" strokeWidth="1" strokeDasharray={i === 0 ? '0' : '3 4'} />
            <text x={padL - 9} y={yOf(v) + 3.5} textAnchor="end" fontSize="10" fill="var(--ink-4)" fontFamily="var(--font-mono)">
              {fmtTick(v)}
            </text>
          </g>
        ))}

        {series.map((s, si) => (
          <g key={si}>
            {area && <path d={areaOf(s.data)} fill={`url(#${uid}-g${si})`} />}
            <path
              d={pathOf(s.data)}
              fill="none"
              stroke={s.color}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                strokeDasharray: 2400,
                strokeDashoffset: 0,
                animation: `dash-${uid} 1.6s cubic-bezier(0.16,1,0.3,1) both`,
              }}
            />
          </g>
        ))}

        {hover !== null && (
          <line x1={xOf(hover)} y1={padT} x2={xOf(hover)} y2={padT + ih} stroke="var(--ink-4)" strokeWidth="1" strokeDasharray="3 3" />
        )}
        {hover !== null &&
          series.map((s, si) => (
            <circle key={si} cx={xOf(hover)} cy={yOf(s.data[hover])} r="4" fill="var(--surface)" stroke={s.color} strokeWidth="2" />
          ))}

        {labels.map((l, i) => {
          const step = Math.max(1, Math.ceil(labels.length / 9))
          return i % step === 0 || i === labels.length - 1 ? (
            <text key={i} x={xOf(i)} y={h - 8} textAnchor="middle" fontSize="10" fill="var(--ink-4)" fontFamily="var(--font-mono)">
              {l}
            </text>
          ) : null
        })}

        {labels.map((_, i) => (
          <rect
            key={i}
            x={xOf(i) - iw / labels.length / 2}
            y={padT}
            width={iw / labels.length}
            height={ih}
            fill="transparent"
            onMouseEnter={() => setHover(i)}
          />
        ))}
        <style>{`@keyframes dash-${uid}{from{stroke-dashoffset:2400}to{stroke-dashoffset:0}}`}</style>
      </svg>

      {hover !== null && (
        <div
          style={{
            position: 'absolute',
            left: `${(xOf(hover) / w) * 100}%`,
            top: 0,
            transform: `translate(${xOf(hover) > w * 0.72 ? '-108%' : '10px'}, 0)`,
            background: 'var(--surface-raised)',
            border: '1px solid var(--line-2)',
            borderRadius: 'var(--r-sm)',
            padding: '8px 11px',
            boxShadow: 'var(--shadow-md)',
            pointerEvents: 'none',
            zIndex: 5,
            minWidth: 118,
          }}
        >
          <div className="eyebrow" style={{ marginBottom: 6 }}>
            {labels[hover]}
          </div>
          {series.map((s) => (
            <div key={s.name} className="row-between" style={{ gap: 14, fontSize: 'var(--t-xs)' }}>
              <span className="row" style={{ gap: 5 }}>
                <i style={{ width: 7, height: 7, borderRadius: 2, background: s.color, display: 'block' }} />
                {s.name}
              </span>
              <b className="num">
                {s.data[hover].toLocaleString('zh-CN')}
                {suffix}
              </b>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ---------- 水平条形图 ---------- */
export function BarRow({
  items,
  max,
  suffix = '%',
  showValue = true,
}: {
  items: { label: string; value: number; color?: string; sub?: string; highlight?: boolean }[]
  max?: number
  suffix?: string
  showValue?: boolean
}) {
  const m = max ?? Math.max(...items.map((i) => i.value), 1)
  return (
    <div className="col" style={{ gap: 'var(--s-3)' }}>
      {items.map((it, i) => (
        <div key={it.label} className="col" style={{ gap: 5 }}>
          <div className="row-between" style={{ gap: 10 }}>
            <span
              style={{
                fontSize: 'var(--t-xs)',
                color: it.highlight ? 'var(--accent-ink)' : 'var(--ink-2)',
                fontWeight: it.highlight ? 600 : 400,
              }}
              className="truncate"
            >
              {it.label}
              {it.sub && <span className="muted" style={{ marginLeft: 6, fontSize: 'var(--t-2xs)' }}>{it.sub}</span>}
            </span>
            {showValue && (
              <b className="num" style={{ fontSize: 'var(--t-xs)', color: it.highlight ? 'var(--accent)' : 'var(--ink)' }}>
                {it.value}
                {suffix}
              </b>
            )}
          </div>
          <div style={{ height: 7, background: 'var(--surface-2)', borderRadius: 99, overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${(it.value / m) * 100}%`,
                background: it.color ?? (it.highlight ? 'var(--accent)' : 'var(--ink-4)'),
                borderRadius: 99,
                transition: 'width 1.1s cubic-bezier(0.16,1,0.3,1)',
                transitionDelay: `${i * 65}ms`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

/* ---------- 雷达图（AIVO 四维） ---------- */
export function RadarChart({
  axes,
  size = 250,
}: {
  axes: { label: string; value: number }[]
  size?: number
}) {
  const c = size / 2
  const r = c - 42
  const n = axes.length
  const [on, setOn] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setOn(true), 150)
    return () => clearTimeout(t)
  }, [])

  const pt = (i: number, ratio: number) => {
    const a = (i / n) * 2 * Math.PI - Math.PI / 2
    return [c + Math.cos(a) * r * ratio, c + Math.sin(a) * r * ratio]
  }

  const rings = [0.25, 0.5, 0.75, 1]
  const poly = (ratio: number) =>
    Array.from({ length: n }, (_, i) => pt(i, ratio).join(',')).join(' ')
  const dataPoly = axes.map((a, i) => pt(i, on ? a.value / 100 : 0).join(',')).join(' ')

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible' }}>
      {rings.map((ring, i) => (
        <polygon key={i} points={poly(ring)} fill="none" stroke="var(--line)" strokeWidth="1" />
      ))}
      {axes.map((_, i) => {
        const [x, y] = pt(i, 1)
        return <line key={i} x1={c} y1={c} x2={x} y2={y} stroke="var(--line)" strokeWidth="1" />
      })}
      <polygon
        points={dataPoly}
        fill="var(--accent)"
        fillOpacity="0.16"
        stroke="var(--accent)"
        strokeWidth="2"
        strokeLinejoin="round"
        style={{ transition: 'all 1.2s cubic-bezier(0.16,1,0.3,1)' }}
      />
      {axes.map((a, i) => {
        const [x, y] = pt(i, on ? a.value / 100 : 0)
        return <circle key={i} cx={x} cy={y} r="3.5" fill="var(--surface)" stroke="var(--accent)" strokeWidth="2" style={{ transition: 'all 1.2s cubic-bezier(0.16,1,0.3,1)' }} />
      })}
      {axes.map((a, i) => {
        const [x, y] = pt(i, 1.24)
        return (
          <g key={i}>
            <text x={x} y={y - 4} textAnchor="middle" fontSize="11" fill="var(--ink-2)">
              {a.label}
            </text>
            <text x={x} y={y + 11} textAnchor="middle" fontSize="12" fontWeight="600" fill="var(--accent)" fontFamily="var(--font-mono)">
              {a.value}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

/* ---------- 堆叠柱状图 ---------- */
export function StackBars({
  labels,
  stacks,
  height = 200,
}: {
  labels: string[]
  stacks: { name: string; color: string; data: number[] }[]
  height?: number
}) {
  const [hover, setHover] = useState<number | null>(null)
  const w = 720
  const h = height
  const padL = 46
  const padR = 12
  const padT = 14
  const padB = 26
  const iw = w - padL - padR
  const ih = h - padT - padB

  const totals = labels.map((_, i) => stacks.reduce((s, st) => s + (st.data[i] ?? 0), 0))
  const max = Math.max(...totals, 1) * 1.1
  const bw = (iw / labels.length) * 0.56
  const xOf = (i: number) => padL + (iw / labels.length) * (i + 0.5)
  const hOf = (v: number) => (v / max) * ih

  const fmtTick = (v: number) => (v >= 10000 ? (v / 10000).toFixed(1) + '万' : Math.round(v).toString())

  return (
    <div style={{ position: 'relative' }}>
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 'auto' }} onMouseLeave={() => setHover(null)}>
        {Array.from({ length: 5 }, (_, i) => {
          const v = (max / 4) * i
          const y = padT + ih - hOf(v)
          return (
            <g key={i}>
              <line x1={padL} y1={y} x2={w - padR} y2={y} stroke="var(--line)" strokeWidth="1" strokeDasharray={i === 0 ? '0' : '3 4'} />
              <text x={padL - 9} y={y + 3.5} textAnchor="end" fontSize="10" fill="var(--ink-4)" fontFamily="var(--font-mono)">
                {fmtTick(v)}
              </text>
            </g>
          )
        })}

        {labels.map((l, i) => {
          let acc = 0
          return (
            <g key={i} onMouseEnter={() => setHover(i)} style={{ cursor: 'default' }}>
              <rect x={xOf(i) - iw / labels.length / 2} y={padT} width={iw / labels.length} height={ih} fill="transparent" />
              {stacks.map((st, si) => {
                const v = st.data[i] ?? 0
                const bh = hOf(v)
                const y = padT + ih - acc - bh
                acc += bh
                return (
                  <rect
                    key={si}
                    x={xOf(i) - bw / 2}
                    y={y}
                    width={bw}
                    height={Math.max(0, bh)}
                    fill={st.color}
                    opacity={hover === null || hover === i ? 1 : 0.35}
                    rx={si === stacks.length - 1 ? 2.5 : 0}
                    style={{
                      transition: 'opacity 180ms',
                      animation: `grow 900ms cubic-bezier(0.16,1,0.3,1) ${i * 22}ms both`,
                      transformOrigin: `center ${padT + ih}px`,
                    }}
                  />
                )
              })}
              <text x={xOf(i)} y={h - 7} textAnchor="middle" fontSize="10" fill="var(--ink-4)" fontFamily="var(--font-mono)">
                {l}
              </text>
            </g>
          )
        })}
        <style>{`@keyframes grow{from{transform:scaleY(0)}to{transform:scaleY(1)}}`}</style>
      </svg>

      {hover !== null && (
        <div
          style={{
            position: 'absolute',
            left: `${(xOf(hover) / w) * 100}%`,
            top: 4,
            transform: `translate(${xOf(hover) > w * 0.7 ? '-108%' : '12px'},0)`,
            background: 'var(--surface-raised)',
            border: '1px solid var(--line-2)',
            borderRadius: 'var(--r-sm)',
            padding: '8px 11px',
            boxShadow: 'var(--shadow-md)',
            pointerEvents: 'none',
            zIndex: 5,
            minWidth: 130,
          }}
        >
          <div className="eyebrow" style={{ marginBottom: 6 }}>
            {labels[hover]}
          </div>
          {stacks.map((s) => (
            <div key={s.name} className="row-between" style={{ gap: 14, fontSize: 'var(--t-xs)' }}>
              <span className="row" style={{ gap: 5 }}>
                <i style={{ width: 7, height: 7, borderRadius: 2, background: s.color, display: 'block' }} />
                {s.name}
              </span>
              <b className="num">{(s.data[hover] ?? 0).toLocaleString('zh-CN')}</b>
            </div>
          ))}
          <div className="row-between" style={{ gap: 14, fontSize: 'var(--t-xs)', marginTop: 5, paddingTop: 5, borderTop: '1px solid var(--line)' }}>
            <span className="muted">合计</span>
            <b className="num">{totals[hover].toLocaleString('zh-CN')}</b>
          </div>
        </div>
      )}
    </div>
  )
}

/* ---------- 情感分布条 ---------- */
export function SentimentBar({ positive, neutral, negative }: { positive: number; neutral: number; negative: number }) {
  const segs = [
    { v: positive, c: 'var(--ok)', l: '正面' },
    { v: neutral, c: 'var(--ink-4)', l: '中性' },
    { v: negative, c: 'var(--danger)', l: '负面' },
  ]
  return (
    <div className="col" style={{ gap: 'var(--s-3)' }}>
      <div style={{ display: 'flex', height: 12, borderRadius: 99, overflow: 'hidden', background: 'var(--surface-2)' }}>
        {segs.map((s, i) => (
          <div
            key={i}
            style={{
              width: `${s.v}%`,
              background: s.c,
              transition: 'width 1.1s cubic-bezier(0.16,1,0.3,1)',
              transitionDelay: `${i * 90}ms`,
            }}
            title={`${s.l} ${s.v}%`}
          />
        ))}
      </div>
      <div className="row wrap" style={{ gap: 'var(--s-4)' }}>
        {segs.map((s) => (
          <span key={s.l} className="row" style={{ gap: 6, fontSize: 'var(--t-xs)', color: 'var(--ink-2)' }}>
            <i style={{ width: 8, height: 8, borderRadius: 2, background: s.c, display: 'block' }} />
            {s.l} <b className="num">{s.v}%</b>
          </span>
        ))}
      </div>
    </div>
  )
}

/* ---------- 迷你走势 ---------- */
export function Spark({ data, color = 'var(--accent)', width = 76, height = 26 }: { data: number[]; color?: string; width?: number; height?: number }) {
  const max = Math.max(...data, 1)
  const min = Math.min(...data, 0)
  const d = data
    .map((v, i) => {
      const x = (i / Math.max(1, data.length - 1)) * width
      const y = height - ((v - min) / Math.max(1, max - min)) * (height - 3) - 1.5
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ flex: 'none' }}>
      <path d={d} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
