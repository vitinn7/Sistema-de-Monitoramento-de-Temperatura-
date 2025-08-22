@echo off
cls
echo =====================================
echo   🏥 HEALTH CHECK - Sistema Meteorológico  
echo =====================================
echo.

:: Verificar se Docker está rodando
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Desktop não está rodando
    exit /b 1
)

echo ✅ Docker está rodando
echo.

echo =====================================
echo   📊 STATUS DOS CONTAINERS
echo =====================================
echo.

:: Verificar containers
for /f "tokens=*" %%i in ('docker-compose ps --services') do (
    echo Verificando %%i...
    docker-compose ps %%i | findstr "Up"
    if !errorlevel! equ 0 (
        echo ✅ %%i está rodando
    ) else (
        echo ❌ %%i não está rodando
    )
)

echo.
echo =====================================
echo   🔍 TESTES DE CONECTIVIDADE
echo =====================================
echo.

:: Testar API Health
echo Testando API Health...
curl -s -o nul -w "Status: %%{http_code}" http://localhost:3000/health 2>nul
if %errorlevel% equ 0 (
    echo ✅ API Health Check OK
) else (
    echo ❌ API Health Check FALHOU
)

echo.

:: Testar Frontend
echo Testando Frontend...
curl -s -o nul -w "Status: %%{http_code}" http://localhost:3001 2>nul
if %errorlevel% equ 0 (
    echo ✅ Frontend OK
) else (
    echo ❌ Frontend FALHOU
)

echo.

:: Testar PostgreSQL
echo Testando PostgreSQL...
docker-compose exec -T postgres pg_isready -U temperatura_user -d temperatura_db >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ PostgreSQL OK
    
    :: Contar cidades
    for /f %%i in ('docker-compose exec -T postgres psql -U temperatura_user -d temperatura_db -t -c "SELECT COUNT(*) FROM cidades;" 2^>nul') do set cidade_count=%%i
    echo    Cidades cadastradas: %cidade_count%
) else (
    echo ❌ PostgreSQL FALHOU
)

echo.

:: Testar Redis  
echo Testando Redis...
docker-compose exec -T redis redis-cli ping >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Redis OK
) else (
    echo ❌ Redis FALHOU  
)

echo.
echo =====================================
echo   🎯 RESUMO FINAL
echo =====================================
echo.

:: Verificar se todos os serviços críticos estão OK
set all_ok=1

docker-compose ps postgres | findstr "Up" >nul || set all_ok=0
docker-compose ps redis | findstr "Up" >nul || set all_ok=0
docker-compose ps api | findstr "Up" >nul || set all_ok=0
docker-compose ps frontend | findstr "Up" >nul || set all_ok=0

if %all_ok% equ 1 (
    echo 🎉 TODOS OS SERVIÇOS ESTÃO FUNCIONANDO!
    echo.
    echo 🌐 URLs da Aplicação:
    echo    Frontend: http://localhost:3001
    echo    Backend:  http://localhost:3000  
    echo    Health:   http://localhost:3000/health
    echo.
    echo ✅ Sistema pronto para uso!
) else (
    echo ⚠️  ALGUNS SERVIÇOS ESTÃO COM PROBLEMAS
    echo.
    echo 💡 Tente:
    echo    docker-compose restart
    echo    ou
    echo    docker-compose up -d --build
)

echo.
pause
