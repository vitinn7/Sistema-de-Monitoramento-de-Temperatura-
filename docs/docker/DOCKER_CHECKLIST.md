# ✅ Checklist de Verificação Docker - Sistema Meteorológico

## 📋 Pré-Execução

- [ ] Docker Desktop instalado e rodando
- [ ] Pasta do projeto acessível
- [ ] Portas 3000, 3001, 5432, 6379 livres

## 🗂️ Estrutura de Arquivos

### Arquivos Principais
- [ ] `docker-compose.yml` existe na raiz
- [ ] `docker_manager.bat` existe na raiz  
- [ ] `DOCKER_GUIA_COMPLETO.md` existe na raiz

### Backend
- [ ] `backend/Dockerfile` existe
- [ ] `backend/.dockerignore` existe
- [ ] `backend/package.json` existe
- [ ] `backend/src/` pasta existe

### Frontend  
- [ ] `frontend/Dockerfile` existe
- [ ] `frontend/.dockerignore` existe
- [ ] `frontend/package.json` existe
- [ ] `frontend/src/` pasta existe

### Database
- [ ] `database/00_docker_setup.sql` existe
- [ ] `database/01_schema.sql` existe  
- [ ] `database/02_seeds.sql` existe
- [ ] `database/03_functions.sql` existe

### Docker Config
- [ ] `docker/postgres.conf` existe
- [ ] `docker/redis.conf` existe
- [ ] `docker/nginx-frontend.conf` existe

## 🚀 Execução

### Comando Básico
```powershell
cd "pasta_do_projeto"
docker-compose up -d
```

### Ou usar o script:
```powershell
.\docker_manager.bat
```

## 🔍 Verificação de Funcionamento

### 1. Status dos Containers
```powershell
docker-compose ps
```

**Esperado:**
```
NAME                   STATUS
temperatura_postgres   Up (healthy)
temperatura_redis      Up (healthy)  
temperatura_api        Up (healthy)
temperatura_frontend   Up
```

### 2. URLs Funcionando
- [ ] http://localhost:3001 (Frontend carrega)
- [ ] http://localhost:3000/health (Backend responde)
- [ ] PostgreSQL conecta na porta 5432
- [ ] Redis conecta na porta 6379

### 3. Logs sem Erro
```powershell
docker-compose logs postgres | findstr "SUCESSO"
docker-compose logs api | findstr "Server"  
docker-compose logs frontend | findstr "ready"
```

### 4. Banco de Dados
```powershell
docker-compose exec postgres psql -U temperatura_user -d temperatura_db -c "SELECT COUNT(*) FROM cidades;"
```
**Esperado:** 3 cidades

## 🆘 Troubleshooting Rápido

### Postgres não sobe
```powershell
docker-compose logs postgres
# Verificar se porta 5432 está livre
netstat -ano | findstr :5432
```

### API não conecta no banco
```powershell
docker-compose restart postgres
# Aguardar 30 segundos
docker-compose restart api
```

### Frontend não carrega
```powershell
docker-compose logs frontend
# Verificar se API está respondendo
curl http://localhost:3000/health
```

### Rebuild completo
```powershell
docker-compose down -v
docker-compose up -d --build
```

## 📊 Comandos Úteis

### Ver todos os logs
```powershell
docker-compose logs -f
```

### Entrar no container
```powershell
docker-compose exec api sh
docker-compose exec postgres psql -U temperatura_user -d temperatura_db
```

### Limpeza completa
```powershell
docker-compose down -v
docker system prune -f
```

## ✅ Checklist Final de Sucesso

- [ ] Todos os containers UP e HEALTHY
- [ ] Frontend acessível em localhost:3001
- [ ] API responde em localhost:3000/health
- [ ] Banco possui 3 cidades cadastradas
- [ ] Redis está funcionando
- [ ] Logs não mostram erros críticos

## 🎯 Se tudo estiver ✅ GREEN:

**🎉 PARABÉNS! Sua aplicação meteorológica está rodando com Docker!**

### Próximos Passos:
1. Testar funcionalidades do dashboard
2. Verificar coleta de dados da API
3. Testar sistema de alertas
4. Configurar monitoramento (opcional)

---

**💡 Dica:** Salve este checklist e use sempre que subir a aplicação!
