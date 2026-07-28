@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo  红动漫社萌战 - Next.js Demo
echo  目录: %CD%
echo.

if not exist node_modules (
  echo [1/2] 正在安装依赖...
  call npm install
  if errorlevel 1 goto :error
)

echo [2/2] 正在启动开发服务器并打开浏览器...
call npm run dev:open
goto :end

:error
echo.
echo 启动失败。请确认已安装 Node.js: https://nodejs.org
pause
exit /b 1

:end
