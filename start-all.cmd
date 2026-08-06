@echo off
chcp 65001 >nul
title 哲唯科技~GEO交付平台 一键启动
cd /d "%~dp0"

echo ================================================
echo   哲唯科技~GEO交付平台  -  一键启动
echo ================================================

where node >nul 2>nul
if errorlevel 1 (
  echo [错误] 没有检测到 Node.js，请先安装后再运行。
  echo 正在为你打开下载页面：https://nodejs.org/zh-cn/download
  start https://nodejs.org/zh-cn/download
  pause
  exit /b 1
)

if not exist node_modules\vite\package.json (
  echo [1/3] 首次运行：正在安装依赖（约1-3分钟，请耐心等待）...
  call npm install
  if errorlevel 1 (
    echo [错误] 依赖安装失败，请检查网络后重新双击本文件。
    pause
    exit /b 1
  )
)

echo [2/3] 启动后端服务（API:8787 + 分发端口 9091-9100）...
start "zhewei-backend" cmd /k "npm run dev:server"
timeout /t 2 /nobreak >nul

echo [3/3] 启动前端并打开浏览器 http://localhost:5187
start "zhewei-frontend" cmd /k "npm run dev"
timeout /t 3 /nobreak >nul
start http://localhost:5187

echo.
echo 完成！请保持弹出的「后端」「前端」两个黑色窗口一直开着。
echo 关掉它们 = 停止服务；下次再打开，双击本文件即可。
echo.
pause
