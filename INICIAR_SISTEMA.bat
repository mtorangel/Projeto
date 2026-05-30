@echo off
title Iniciador Health Analytics Dashboard
echo ==========================================
echo   INICIANDO SERVIDORES DO DASHBOARD
echo ==========================================

:: 1. Iniciar Back-end (Django)
echo [1/2] Iniciando Back-end na porta 8000...
start cmd /k "cd painel-saude-backend && venv\Scripts\activate && python manage.py runserver"

:: 2. Iniciar Front-end (React/Vite)
echo [2/2] Iniciando Front-end na porta 3000...
start cmd /k "cd painel-saude-frontend && npm run dev"

echo.
echo ==========================================
echo   TUDO PRONTO! 
echo   Aguarde alguns segundos e acesse:
echo   http://localhost:3000
echo ==========================================
pause
