# 哲唯科技~GEO交付平台 · 后端服务

零依赖 Node.js（≥18）后端：真实爬虫 / GEO 体检 / AI 内容生成 / 10 平台绑定与发布 / 端口绑定。

## 启动

```bash
cd C:\Users\DELL\Documents\Codex\2026-08-05\new-chat\xianying-geo
node server/server.mjs
# API: http://localhost:8787
# 分发服务端口: 9091-9100（已绑定即证明端口开放）
```

可选：复制 `server/.env.example` 为 `server/.env` 配置大模型 Key、平台凭证、端口。

## 接口一览

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | /api/health | 健康检查（含 LLM/端口状态） |
| GET | /api/ports | 已绑定的分发平台端口清单 |
| GET | /api/company/info?website= | 企业官网真实抓取 |
| GET | /api/search?type=eco/industry/longtail&brand=&cat= | 联网真实检索（Bing） |
| POST | /api/geo/audit | 真实数据 GEO 体检（生成报告） |
| GET | /api/channels?clientId= | 10 平台连接状态 |
| POST | /api/channels/:code/connect | 发起绑定（OAuth 跳转 / API Key / Cookie） |
| GET | /api/channels/oauth/:code/callback | OAuth 回调 |
| POST | /api/channels/:code/disconnect | 解绑 |
| POST | /api/channels/:code/refresh | 刷新凭证 |
| POST | /api/publish | 多平台发布（沙箱模拟/真实 API） |
| POST | /api/ai/generate | AI 原创内容生成（公司事实驱动 + 平台合规 + GEO 结构） |

## 真实投产开关

- `SANDBOX_MODE=false` 且填入平台开发者凭证 → 连接走真实 OAuth、发布走平台 API（当前已实现微信公众号草稿示例，其余平台适配器待按开放平台文档补齐）。
- 配置 `LLM_API_KEY` → AI 生成与大模型 GEO 实测生效；未配置则用启发式生成器，功能仍可用。
