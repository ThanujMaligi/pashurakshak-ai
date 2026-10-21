@echo off
title PashuRakshak AI - FastAPI Backend (Port 8000)
cd /d "%~dp0backend"
echo ========================================================
echo Starting PashuRakshak AI - Emergency Operations Backend
echo Serving at: http://127.0.0.1:8000
echo API Docs at: http://127.0.0.1:8000/docs
echo ========================================================
py -3.12 run.py
pause
