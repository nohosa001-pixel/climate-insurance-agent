@echo off
chcp 65001 > nul
cd /d "%~dp0"
title AgriPulse AI - Climate Satellite, ML Yield & CBOT Quant Platform
echo =========================================================================
echo   🛰️ [AGRIPULSE AI] Climate Insurance & CBOT Quant Autonomous Agent
echo =========================================================================
echo.
echo  기존 잔여 서버 프로세스를 정리하고 최신 대시보드 서버를 시작합니다...
powershell -Command "Get-Process -Name python -ErrorAction SilentlyContinue | Where-Object { $_.Id -ne $PID } | Stop-Process -Force -ErrorAction SilentlyContinue" > nul 2>&1
echo.
echo  웹 브라우저(http://localhost:8500)가 곧 자동으로 열립니다...
echo.
python run.py
pause
