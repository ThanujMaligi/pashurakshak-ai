@echo off
title PashuRakshak AI - Next.js CAD Console (Port 3000)
cd /d "%~dp0frontend"
echo ========================================================
echo Starting PashuRakshak AI - Emergency Operations Console
echo Serving at: http://localhost:3000
echo ========================================================
node ./node_modules/next/dist/bin/next dev -p 3000
pause
