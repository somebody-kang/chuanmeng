@echo off
setlocal EnableExtensions EnableDelayedExpansion
chcp 65001 >nul
cd /d "%~dp0"

echo.
echo  ========================================
echo   红动漫社萌战 - Next.js Demo
echo   目录: %CD%
echo  ========================================
echo.

where node >nul 2>&1
if errorlevel 1 (
  echo [错误] 未检测到 Node.js。
  echo 请安装 LTS 版本后重试: https://nodejs.org
  goto :error
)

where npm >nul 2>&1
if errorlevel 1 (
  echo [错误] 未检测到 npm，请重新安装 Node.js。
  goto :error
)

for /f "tokens=*" %%v in ('node -v 2^>nul') do set "NODE_VER=%%v"
echo [信息] Node.js %NODE_VER%
echo.

REM 生成本地 .env（仓库不包含该文件；不含微信真实凭证）
echo [0/3] 检查本地环境配置...
call node scripts/ensure-env.mjs
if errorlevel 1 (
  echo [错误] 无法创建本地 .env
  goto :error
)

REM 给 Prisma CLI 兜底，避免偶发未加载 dotenv
if not defined DATABASE_URL set "DATABASE_URL=file:./dev.db"

REM 加速依赖与 Prisma 引擎下载（国内网络）
if not defined NPM_CONFIG_REGISTRY (
  set "NPM_CONFIG_REGISTRY=https://registry.npmmirror.com"
)
if not defined PRISMA_ENGINES_MIRROR (
  set "PRISMA_ENGINES_MIRROR=https://npmmirror.com/mirrors/prisma"
)

set "NEED_INSTALL=0"
if not exist "node_modules\" set "NEED_INSTALL=1"
if not exist "node_modules\next\package.json" set "NEED_INSTALL=1"
if not exist "node_modules\prisma\package.json" set "NEED_INSTALL=1"

if "!NEED_INSTALL!"=="1" (
  echo [1/3] 正在安装依赖（首次约 1～5 分钟，请勿关闭窗口）...
  echo       npm 镜像: %NPM_CONFIG_REGISTRY%
  echo       Prisma 引擎镜像: %PRISMA_ENGINES_MIRROR%
  echo.
  call npm install --no-audit --no-fund --no-update-notifier
  if errorlevel 1 (
    echo.
    echo [错误] npm install 失败。可尝试：
    echo   1^) 检查网络后重新双击 start.bat
    echo   2^) 手动执行: npm install --registry=https://registry.npmmirror.com
    goto :error
  )
  echo.
  echo [1/3] 依赖安装完成。
) else (
  echo [1/3] 依赖已就绪，跳过 npm install。
)

echo.
echo [2/3] 准备 Prisma Client 与数据库...
call npx --yes prisma generate
if errorlevel 1 (
  echo [错误] prisma generate 失败（多为引擎下载超时）。
  echo 请确认网络后重试，或检查 PRISMA_ENGINES_MIRROR。
  goto :error
)

if not exist "prisma\dev.db" (
  echo       首次初始化数据库...
  call npx --yes prisma db push
  if errorlevel 1 (
    echo [错误] 数据库初始化失败。请确认已生成 .env 且含 DATABASE_URL。
    goto :error
  )
  call npx --yes tsx prisma/seed.ts
  if errorlevel 1 goto :error
  echo       数据库初始化完成。
) else (
  echo       数据库已存在，跳过初始化。
)

echo.
echo [3/3] 启动开发服务器（浏览器将自动打开）...
echo       若未自动打开，请访问 http://localhost:3000
echo.
call npm run dev:open
set "EXITCODE=%ERRORLEVEL%"
goto :finish

:error
echo.
echo ----------------------------------------
echo 启动失败。
echo ----------------------------------------
pause
endlocal
exit /b 1

:finish
if not "%EXITCODE%"=="0" (
  echo.
  echo 进程已退出，代码: %EXITCODE%
  pause
  endlocal
  exit /b %EXITCODE%
)
endlocal
exit /b 0
