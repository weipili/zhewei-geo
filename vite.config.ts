import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 显影 · 构建配置
// base: './' 便于产物直接以 file:// 或任意子路径静态托管
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    port: 5187,
    host: true,
    // 开发环境：/api 代理到后端服务（node server/server.mjs，默认 8787）
    proxy: {
      '/api': { target: 'http://localhost:8787', changeOrigin: true },
    },
  },
  build: {
    outDir: 'dist',
    // Windows 上 Vite 默认的 emptyOutDir 会走"移入回收站"的 shim 而失败，
    // 改为 false 由构建脚本手动 rm -rf dist 清理，更可控。
    emptyOutDir: false,
    sourcemap: false,
  },
})
