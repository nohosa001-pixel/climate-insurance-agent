@echo off
chcp 65001 > nul
cd /d "%~dp0"
title Trade Climate & Compliance Oracle Subsystem (v3.0)
echo =========================================================================
echo   [TRADE ORACLE] Climate & EUDR Compliance Oracle Subsystem (v3.0)
echo =========================================================================
echo.
echo  Starting FastAPI Trade Oracle server on http://localhost:8500/docs ...
echo.
python run.py
pause
