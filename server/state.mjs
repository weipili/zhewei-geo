// ============================================================
// 渠道账号状态（内存 + JSON 落盘）
// 真实投产应替换为数据库；凭证明文仅限沙箱，正式环境须加密存储
// ============================================================
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, 'data')
const FILE = path.join(DATA_DIR, 'state.json')

let state = { accounts: [] }

function load() {
  try {
    if (fs.existsSync(FILE)) {
      state = JSON.parse(fs.readFileSync(FILE, 'utf-8'))
      if (!Array.isArray(state.accounts)) state.accounts = []
    }
  } catch { state = { accounts: [] } }
}

function save() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
    fs.writeFileSync(FILE, JSON.stringify(state, null, 2), 'utf-8')
  } catch { /* 落盘失败不阻塞运行 */ }
}

load()

export function listAccounts(clientId) {
  return state.accounts.filter((a) => a.clientId === clientId)
}

export function getAccount(clientId, code) {
  return state.accounts.find((a) => a.clientId === clientId && a.code === code) || null
}

export function upsertAccount(clientId, code, patch) {
  const i = state.accounts.findIndex((a) => a.clientId === clientId && a.code === code)
  const base = { clientId, code, connected: false, health: 'off' }
  if (i < 0) state.accounts.push({ ...base, ...patch })
  else state.accounts[i] = { ...state.accounts[i], ...patch }
  save()
  return state.accounts.find((a) => a.clientId === clientId && a.code === code)
}

export function removeAccount(clientId, code) {
  state.accounts = state.accounts.filter((a) => !(a.clientId === clientId && a.code === code))
  save()
}
