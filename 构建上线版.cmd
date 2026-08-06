@echo off
chcp 65001 >nul
title 构建正式版
cd /d "%~dp0"
echo 正在编译正式版（dist），请稍候...
if not exist node_modules\vite\package.json (
  call npm install --no-audit --no-fund
)
call npm run build
if errorlevel 1 (
  echo 编译失败，请检查网络后重试。
  pause
  exit /b 1
)
echo.
echo 编译完成！正式版在 dist 文件夹。
echo 上传方式：Cloudflare Pages -> Create project -> Upload assets -> 选 dist 文件夹。
echo.
pause
