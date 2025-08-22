@echo off
cls
echo =====================================
echo   🐳 DOCKER - Sistema Meteorológico
echo =====================================
echo.

:: Verificar se Docker está rodando
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ERRO: Docker Desktop não está rodando
    echo.
    echo 💡 SOLUÇÃO:
    echo 1. Abra o Docker Desktop
    echo 2. Aguarde inicializar completamente
    echo 3. Execute este script novamente
    echo.
    pause
    exit /b 1
)

echo ✅ Docker está rodando
echo.

:: Mostrar menu de opções
echo =====================================
echo   ESCOLHA UMA OPÇÃO:
echo =====================================
echo.
echo 1. 🚀 INICIAR APLICAÇÃO (Desenvolvimento)
echo 2. 🛑 PARAR APLICAÇÃO
echo 3. 🔄 REINICIAR APLICAÇÃO
echo 4. 🧹 LIMPEZA COMPLETA (APAGA DADOS!)
echo 5. 📊 VER STATUS
echo 6. 📝 VER LOGS
echo 7. 🔧 REBUILD (Após mudanças no código)
echo 8. 🏭 MODO PRODUÇÃO
echo 9. ❌ SAIR
echo.

set /p choice="Digite sua escolha (1-9): "

if "%choice%"=="1" goto start_dev
if "%choice%"=="2" goto stop_app
if "%choice%"=="3" goto restart_app
if "%choice%"=="4" goto clean_all
if "%choice%"=="5" goto show_status
if "%choice%"=="6" goto show_logs
if "%choice%"=="7" goto rebuild_app
if "%choice%"=="8" goto start_prod
if "%choice%"=="9" goto exit

echo ❌ Opção inválida!
pause
goto start

:start_dev
echo.
echo =====================================
echo   🚀 INICIANDO APLICAÇÃO
echo =====================================
echo.
echo 1. Subindo banco de dados e Redis...
docker-compose up -d postgres redis

echo.
echo 2. Aguardando PostgreSQL inicializar (30s)...
timeout /t 30 /nobreak

echo.
echo 3. Verificando banco de dados...
docker-compose logs postgres | findstr "FUNCTIONS CRIADAS COM SUCESSO"
if %errorlevel% neq 0 (
    echo ⚠️  Aguardando mais um pouco...
    timeout /t 10 /nobreak
)

echo.
echo 4. Subindo API e Frontend...
docker-compose up -d api frontend

echo.
echo =====================================
echo   ✅ APLICAÇÃO INICIADA!
echo =====================================
echo.
echo 🌐 URLs da Aplicação:
echo   Frontend: http://localhost:3001
echo   Backend:  http://localhost:3000
echo   Health:   http://localhost:3000/health
echo.
echo 📊 Verificando status...
docker-compose ps
echo.

set /p open_browser="Deseja abrir o navegador? (s/n): "
if /i "%open_browser%"=="s" (
    start http://localhost:3001
    start http://localhost:3000/health
)

pause
goto start

:stop_app
echo.
echo =====================================
echo   🛑 PARANDO APLICAÇÃO
echo =====================================
echo.
docker-compose stop
echo.
echo ✅ Aplicação parada com sucesso!
echo.
pause
goto start

:restart_app
echo.
echo =====================================
echo   🔄 REINICIANDO APLICAÇÃO
echo =====================================
echo.
echo 1. Parando serviços...
docker-compose stop
echo.
echo 2. Reiniciando serviços...
docker-compose up -d
echo.
echo ✅ Aplicação reiniciada!
echo.
pause
goto start

:clean_all
echo.
echo =====================================
echo   🧹 LIMPEZA COMPLETA
echo =====================================
echo.
echo ⚠️  ATENÇÃO: Isso vai apagar TODOS os dados!
set /p confirm="Tem certeza? Digite 'CONFIRMO': "
if not "%confirm%"=="CONFIRMO" (
    echo ❌ Operação cancelada
    pause
    goto start
)

echo.
echo 1. Parando e removendo containers...
docker-compose down -v

echo.
echo 2. Limpando sistema Docker...
docker system prune -f

echo.
echo ✅ Limpeza completa realizada!
echo.
pause
goto start

:show_status
echo.
echo =====================================
echo   📊 STATUS DOS SERVIÇOS
echo =====================================
echo.
docker-compose ps
echo.
echo =====================================
echo   🔍 HEALTH CHECKS
echo =====================================
echo.
echo Testando API...
curl -s http://localhost:3000/health 2>nul || echo API não disponível
echo.
echo.
pause
goto start

:show_logs
echo.
echo =====================================
echo   📝 LOGS DOS SERVIÇOS
echo =====================================
echo.
echo Escolha o serviço:
echo 1. Todos os serviços
echo 2. PostgreSQL
echo 3. API (Backend)
echo 4. Frontend
echo 5. Redis
echo.

set /p log_choice="Digite sua escolha (1-5): "

if "%log_choice%"=="1" docker-compose logs --tail=50
if "%log_choice%"=="2" docker-compose logs --tail=50 postgres
if "%log_choice%"=="3" docker-compose logs --tail=50 api
if "%log_choice%"=="4" docker-compose logs --tail=50 frontend
if "%log_choice%"=="5" docker-compose logs --tail=50 redis

echo.
pause
goto start

:rebuild_app
echo.
echo =====================================
echo   🔧 REBUILD DA APLICAÇÃO
echo =====================================
echo.
echo 1. Parando serviços...
docker-compose down

echo.
echo 2. Fazendo rebuild...
docker-compose up -d --build

echo.
echo ✅ Rebuild concluído!
echo.
pause
goto start

:start_prod
echo.
echo =====================================
echo   🏭 MODO PRODUÇÃO
echo =====================================
echo.
echo 1. Subindo com perfil de produção...
docker-compose --profile production up -d

echo.
echo 2. Subindo monitoramento...
docker-compose --profile monitoring up -d

echo.
echo =====================================
echo   ✅ MODO PRODUÇÃO ATIVO!
echo =====================================
echo.
echo 🌐 URLs:
echo   Aplicação: http://localhost:80
echo   Frontend:  http://localhost:3001
echo   Backend:   http://localhost:3000
echo   Prometheus: http://localhost:9090
echo   Grafana:   http://localhost:3002 (admin/admin_temp_2025)
echo.
pause
goto start

:exit
echo.
echo =====================================
echo   👋 ATÉ LOGO!
echo =====================================
echo.
echo Para parar completamente:
echo   docker-compose down
echo.
exit /b 0

:start
goto :eof
