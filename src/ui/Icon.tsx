/* 手绘图标集 —— 统一 1.6px 描边、22 视窗、方头端点，仪器感 */

const S = ({ children, size = 18 }: { children: React.ReactNode; size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 22 22"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
)

export type IconName =
  | 'dashboard'
  | 'radar'
  | 'compose'
  | 'queue'
  | 'plug'
  | 'users'
  | 'report'
  | 'sun'
  | 'moon'
  | 'auto'
  | 'plus'
  | 'check'
  | 'x'
  | 'chevronR'
  | 'chevronD'
  | 'arrowUp'
  | 'arrowDown'
  | 'search'
  | 'bell'
  | 'clock'
  | 'send'
  | 'edit'
  | 'trash'
  | 'link'
  | 'download'
  | 'sparkle'
  | 'warn'
  | 'info'
  | 'play'
  | 'film'
  | 'doc'
  | 'target'
  | 'trend'
  | 'shield'
  | 'menu'
  | 'refresh'
  | 'external'
  | 'card'
  | 'qrcode'
  | 'unlink'
  | 'globe'

const paths: Record<IconName, React.ReactNode> = {
  dashboard: (
    <>
      <rect x="2.8" y="2.8" width="7" height="7.6" rx="1.4" />
      <rect x="12.2" y="2.8" width="7" height="4.6" rx="1.4" />
      <rect x="2.8" y="13.4" width="7" height="5.8" rx="1.4" />
      <rect x="12.2" y="10.4" width="7" height="8.8" rx="1.4" />
    </>
  ),
  radar: (
    <>
      <circle cx="11" cy="11" r="8.2" />
      <circle cx="11" cy="11" r="4.6" />
      <circle cx="11" cy="11" r="1.1" fill="currentColor" stroke="none" />
      <path d="M11 11 L17 5.4" />
    </>
  ),
  compose: (
    <>
      <path d="M3.2 18.8h15.6" />
      <path d="M5.4 14.2 15.1 4.5a2 2 0 0 1 2.8 2.8L8.2 17H5.4v-2.8Z" />
    </>
  ),
  queue: (
    <>
      <path d="M3.4 5.6h11.2M3.4 11h11.2M3.4 16.4h7" />
      <circle cx="18" cy="16.4" r="2.4" />
    </>
  ),
  plug: (
    <>
      <path d="M7.6 2.8v4.4M14.4 2.8v4.4" />
      <path d="M5.2 7.2h11.6v3.4a5.8 5.8 0 0 1-11.6 0V7.2Z" />
      <path d="M11 16.4v2.8" />
    </>
  ),
  users: (
    <>
      <circle cx="8.4" cy="7.4" r="3.2" />
      <path d="M2.8 18.4a5.6 5.6 0 0 1 11.2 0" />
      <path d="M15 4.6a3.2 3.2 0 0 1 0 5.7M16.8 18.4a5.4 5.4 0 0 0-2.2-4.4" />
    </>
  ),
  report: (
    <>
      <path d="M5 2.8h8l4.2 4.2v12.2H5V2.8Z" />
      <path d="M13 2.8V7h4.2" />
      <path d="M8 12.4v3.4M11 10.2v5.6M14 13.6v2.2" />
    </>
  ),
  sun: (
    <>
      <circle cx="11" cy="11" r="4" />
      <path d="M11 1.6v2.2M11 18.2v2.2M20.4 11h-2.2M3.8 11H1.6M17.6 4.4l-1.6 1.6M6 16l-1.6 1.6M17.6 17.6 16 16M6 6 4.4 4.4" />
    </>
  ),
  moon: <path d="M18.4 12.6A7.8 7.8 0 0 1 9 3.4a7.9 7.9 0 1 0 9.4 9.2Z" />,
  auto: (
    <>
      <circle cx="11" cy="11" r="8" />
      <path d="M11 3a8 8 0 0 0 0 16Z" fill="currentColor" stroke="none" />
    </>
  ),
  plus: <path d="M11 4.4v13.2M4.4 11h13.2" />,
  check: <path d="M4.2 11.4 8.8 16 17.8 6.4" />,
  x: <path d="M5.4 5.4l11.2 11.2M16.6 5.4 5.4 16.6" />,
  chevronR: <path d="M8.2 4.6 14.6 11l-6.4 6.4" />,
  chevronD: <path d="M4.6 8.2 11 14.6l6.4-6.4" />,
  arrowUp: (
    <>
      <path d="M11 17.6V4.8" />
      <path d="M5.6 10.2 11 4.8l5.4 5.4" />
    </>
  ),
  arrowDown: (
    <>
      <path d="M11 4.4v12.8" />
      <path d="M16.4 11.8 11 17.2l-5.4-5.4" />
    </>
  ),
  search: (
    <>
      <circle cx="9.6" cy="9.6" r="6.2" />
      <path d="M14.2 14.2 18.8 18.8" />
    </>
  ),
  bell: (
    <>
      <path d="M5.6 8.8a5.4 5.4 0 0 1 10.8 0c0 4 1.6 5.6 1.6 5.6H4s1.6-1.6 1.6-5.6Z" />
      <path d="M9.2 17.6a2 2 0 0 0 3.6 0" />
    </>
  ),
  clock: (
    <>
      <circle cx="11" cy="11" r="8" />
      <path d="M11 6.2V11l3.2 2" />
    </>
  ),
  send: (
    <>
      <path d="M19 3 9.6 12.4" />
      <path d="M19 3l-6 16-3.4-6.6L3 9l16-6Z" />
    </>
  ),
  edit: (
    <>
      <path d="M9.6 4H4.4a1.6 1.6 0 0 0-1.6 1.6v12a1.6 1.6 0 0 0 1.6 1.6h12a1.6 1.6 0 0 0 1.6-1.6v-5.2" />
      <path d="M16.2 2.8a1.9 1.9 0 0 1 2.7 2.7L11.4 13l-3.4.7.7-3.4 7.5-7.5Z" />
    </>
  ),
  trash: (
    <>
      <path d="M3.4 5.8h15.2M8 5.8V4a1.2 1.2 0 0 1 1.2-1.2h3.6A1.2 1.2 0 0 1 14 4v1.8" />
      <path d="M5.4 5.8l.9 12a1.4 1.4 0 0 0 1.4 1.3h6.6a1.4 1.4 0 0 0 1.4-1.3l.9-12" />
    </>
  ),
  link: (
    <>
      <path d="M9.2 12.8a3.4 3.4 0 0 0 5.1.4l2.8-2.8a3.4 3.4 0 0 0-4.8-4.8l-1.6 1.6" />
      <path d="M12.8 9.2a3.4 3.4 0 0 0-5.1-.4l-2.8 2.8a3.4 3.4 0 0 0 4.8 4.8l1.6-1.6" />
    </>
  ),
  download: (
    <>
      <path d="M11 3v10.4" />
      <path d="M6.6 9.6 11 14l4.4-4.4" />
      <path d="M3.6 17.4v1.4h14.8v-1.4" />
    </>
  ),
  sparkle: (
    <>
      <path d="M11 2.6 12.9 8 18.4 11 12.9 14 11 19.4 9.1 14 3.6 11 9.1 8 11 2.6Z" />
      <path d="M17.6 3.2v3M19.1 4.7h-3" />
    </>
  ),
  warn: (
    <>
      <path d="M11 3.2 19.6 18H2.4L11 3.2Z" />
      <path d="M11 9v3.6M11 15.6h.01" />
    </>
  ),
  info: (
    <>
      <circle cx="11" cy="11" r="8" />
      <path d="M11 10.2v5M11 7.2h.01" />
    </>
  ),
  play: <path d="M7.4 4.4 17 11l-9.6 6.6V4.4Z" />,
  film: (
    <>
      <rect x="2.8" y="4.2" width="16.4" height="13.6" rx="1.6" />
      <path d="M7 4.2v13.6M15 4.2v13.6M2.8 11h16.4M2.8 7.6h4.2M2.8 14.4h4.2M15 7.6h4.2M15 14.4h4.2" />
    </>
  ),
  doc: (
    <>
      <path d="M5.4 2.8h7.2l4 4v12.4H5.4V2.8Z" />
      <path d="M12.6 2.8v4h4" />
      <path d="M8.2 11.4h5.6M8.2 14.6h5.6" />
    </>
  ),
  target: (
    <>
      <circle cx="11" cy="11" r="8" />
      <circle cx="11" cy="11" r="4.4" />
      <circle cx="11" cy="11" r="1.2" fill="currentColor" stroke="none" />
    </>
  ),
  trend: (
    <>
      <path d="M2.8 15.4 8 10.2l3.4 3.4L19.2 5.8" />
      <path d="M14.6 5.8h4.6v4.6" />
    </>
  ),
  shield: (
    <>
      <path d="M11 2.6 3.8 5.6v5.2c0 4.4 3 8 7.2 9.2 4.2-1.2 7.2-4.8 7.2-9.2V5.6L11 2.6Z" />
      <path d="M8.2 11 10.4 13.2 14.4 9.2" />
    </>
  ),
  menu: <path d="M3.2 6h15.6M3.2 11h15.6M3.2 16h15.6" />,
  refresh: (
    <>
      <path d="M18.4 9.2A7.6 7.6 0 0 0 5 6.4L3 8.6" />
      <path d="M3.6 12.8a7.6 7.6 0 0 0 13.4 2.8l2-2.2" />
      <path d="M3 4v4.6h4.6M19 18v-4.6h-4.6" />
    </>
  ),
  external: (
    <>
      <path d="M15.4 11.8v5.4a1.6 1.6 0 0 1-1.6 1.6H4.8a1.6 1.6 0 0 1-1.6-1.6V8.2a1.6 1.6 0 0 1 1.6-1.6h5.4" />
      <path d="M13.4 3.2h5.4v5.4M9 13 18.8 3.2" />
    </>
  ),
  card: (
    <>
      <rect x="3" y="5" width="16" height="12" rx="1.6" />
      <circle cx="7.2" cy="9.6" r="1.9" />
      <path d="M4.8 14.4c.6-1.5 2.3-1.5 2.8 0" />
      <path d="M11 9h5.4M11 12h3.6" />
    </>
  ),
  qrcode: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="12" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="12" width="7" height="7" rx="1" />
      <path d="M12 12h3.4M18 12v3.4M12 18h3.4M18 18h1" />
    </>
  ),
  unlink: (
    <>
      <path d="M9.4 12.6a3.4 3.4 0 0 0 4.9-.2l2.5-2.5a3.4 3.4 0 0 0-4.8-4.8l-1 1" />
      <path d="M12.6 9.4a3.4 3.4 0 0 0-4.9.2L5.2 12.1a3.4 3.4 0 0 0 4.8 4.8l1-1" />
      <path d="M3 3l16 16" />
    </>
  ),
  globe: (
    <>
      <circle cx="11" cy="11" r="8" />
      <path d="M3 11h16" />
      <path d="M11 3c2.4 2.4 3.6 5.6 3.6 8s-1.2 5.6-3.6 8c-2.4-2.4-3.6-5.6-3.6-8s1.2-5.6 3.6-8Z" />
    </>
  ),
}

export function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  return <S size={size}>{paths[name]}</S>
}
