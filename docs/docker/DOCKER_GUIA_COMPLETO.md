# 🐳 Guia Passo a Passo - Docker Sistema Meteorológico

Este guia te levará desde a instalação do Docker até ter a aplicação completa rodando localmente.

## 📋 Pré-requisitos

### 1. Instalar Docker Desktop

**Windows:**
1. Baixe o Docker Desktop: https://www.docker.com/products/docker-desktop
2. Execute o instalador e reinicie o computador
3. Abra o Docker Desktop e aguarde inicializar
4. Verifique a instalação:
   ```powershell
   docker --version
   docker-compose --version
   ```

**Saída esperada:**
```
Docker version 20.10.x ou superior
Docker Compose version 2.x.x ou superior
```

### 2. Verificar Recursos do Sistema
- **Memória:** Mínimo 4GB RAM disponível
- **Disco:** Mínimo 5GB de espaço livre
- **CPU:** 2 cores ou mais (recomendado)

## 🗂️ Estrutura do Projeto

Certifique-se de que sua estrutura está assim:
```
metereologico/
├── docker-compose.yml
├── backend/
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── package.json
│   └── src/
├── frontend/
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── package.json
│   └── src/
├── database/
│   ├── 00_docker_setup.sql
│   ├── 01_schema.sql
│   ├── 02_seeds.sql
│   └── 03_functions.sql
└── docker/
    ├── postgres.conf
    ├── redis.conf
    └── nginx-frontend.conf
```

## 🚀 Passo a Passo para Executar

### Passo 1: Preparar o Ambiente

1. **Abra o PowerShell como Administrador**
2. **Navegue até a pasta do projeto:**
   ```powershell
   cd "c:\Users\Vitor\OneDrive - Syos Sistemas de IOT Ltda\Área de Trabalho\Fiales-treinamento\metereologico"
   ```

3. **Verifique se o Docker está rodando:**
   ```powershell
   docker info
   ```

### Passo 2: Limpar Ambiente (Se Necessário)

Se você já executou antes e quer começar limpo:

```powershell
# Parar todos os containers
docker-compose down

# Remover volumes (CUIDADO: apaga dados do banco)
docker-compose down -v

# Limpar imagens não utilizadas
docker system prune -f
```

### Passo 3: Executar em Modo Desenvolvimento

#### 3.1 Subir apenas o Banco de Dados e Redis primeiro:

```powershell
docker-compose up -d postgres redis
```

**Aguarde cerca de 30 segundos** para o PostgreSQL inicializar completamente.

#### 3.2 Verificar se o banco inicializou:

```powershell
docker-compose logs postgres
```

**Procure por estas mensagens:**
```
✅ DOCKER SETUP INICIAL CONCLUÍDO!
✅ SCHEMA CRIADO COM SUCESSO!  
✅ DADOS INICIAIS INSERIDOS COM SUCESSO!
✅ FUNCTIONS CRIADAS COM SUCESSO!
```

#### 3.3 Subir Backend e Frontend:

```powershell
docker-compose up -d api frontend
```

#### 3.4 Verificar Status dos Serviços:

```powershell
docker-compose ps
```

**Saída esperada:**
```
NAME                   STATUS
temperatura_postgres   Up (healthy)
temperatura_redis      Up (healthy)  
temperatura_api        Up (healthy)
temperatura_frontend   Up
```

### Passo 4: Acessar a Aplicação

#### URLs da Aplicação:
- **Frontend (Dashboard):** http://localhost:3001
- **Backend (API):** http://localhost:3000
- **API Health Check:** http://localhost:3000/health
- **Swagger/Docs:** http://localhost:3000/docs (se configurado)

#### URLs dos Serviços:
- **PostgreSQL:** localhost:5432
- **Redis:** localhost:6379

### Passo 5: Verificar Logs (Troubleshooting)

```powershell
# Ver logs de todos os serviços
docker-compose logs

# Ver logs de um serviço específico
docker-compose logs postgres
docker-compose logs api
docker-compose logs frontend
docker-compose logs redis

# Ver logs em tempo real
docker-compose logs -f api
```

## 🔧 Comandos Úteis

### Gerenciamento de Containers

```powershell
# Ver status dos containers
docker-compose ps

# Parar todos os serviços
docker-compose stop

# Reiniciar um serviço específico
docker-compose restart api

# Rebuild de um serviço (após mudanças no código)
docker-compose up -d --build api

# Entrar no container do banco
docker-compose exec postgres psql -U temperatura_user -d temperatura_db

# Entrar no container da API
docker-compose exec api sh

# Ver logs específicos
docker-compose logs -f --tail=100 api
```

### Dados do Banco

```powershell
# Conectar no PostgreSQL
docker-compose exec postgres psql -U temperatura_user -d temperatura_db

# Comandos SQL úteis dentro do PostgreSQL:
# \dt                          - Listar tabelas
# SELECT * FROM cidades;       - Ver cidades cadastradas
# SELECT * FROM v_temperaturas_atuais; - Ver temperaturas atuais
# \q                           - Sair
```

### Limpeza e Manutenção

```powershell
# Parar e remover containers (mantém dados)
docker-compose down

# Parar e remover containers + volumes (APAGA DADOS!)
docker-compose down -v

# Limpar sistema Docker
docker system prune -f

# Rebuild completo (após mudanças importantes)
docker-compose down
docker-compose up -d --build
```

## 🎯 Modo Produção (Opcional)

Para executar com Nginx, Prometheus e Grafana:

```powershell
# Subir com perfil de produção
docker-compose --profile production up -d

# Subir com monitoramento
docker-compose --profile monitoring up -d

# URLs adicionais:
# - Nginx: http://localhost:80
# - Prometheus: http://localhost:9090  
# - Grafana: http://localhost:3002 (admin/admin_temp_2025)
```

## ❌ Resolução de Problemas Comuns

### Problema: "Port already in use"
```powershell
# Ver o que está usando a porta
netstat -ano | findstr :3000
netstat -ano | findstr :5432

# Parar serviços conflitantes ou mudar portas no docker-compose.yml
```

### Problema: "Database connection failed"
```powershell
# Verificar se o postgres subiu completamente
docker-compose logs postgres

# Aguardar mais tempo ou reiniciar
docker-compose restart postgres
```

### Problema: "Build failed"
```powershell
# Limpar cache do Docker
docker builder prune -f

# Rebuild do zero
docker-compose down
docker-compose up -d --build --force-recreate
```

### Problema: "Frontend não carrega"
```powershell
# Verificar se a API está respondendo
curl http://localhost:3000/health

# Ver logs do frontend
docker-compose logs frontend

# Rebuild do frontend
docker-compose up -d --build frontend
```

## 📊 Verificação Final

### Checklist de Funcionamento:

- [ ] Docker Desktop está rodando
- [ ] PostgreSQL está up e healthy
- [ ] Redis está up e healthy
- [ ] API está up e healthy (http://localhost:3000/health)
- [ ] Frontend está acessível (http://localhost:3001)
- [ ] Banco tem as 3 cidades cadastradas
- [ ] API retorna dados das cidades

### Comando de Verificação Completa:

```powershell
# Verificar tudo de uma vez
docker-compose ps && echo "=== HEALTH CHECKS ===" && curl -s http://localhost:3000/health && echo "=== POSTGRES ===" && docker-compose exec -T postgres psql -U temperatura_user -d temperatura_db -c "SELECT COUNT(*) as cidades FROM cidades;"
```

## 🎉 Pronto!

Se todos os serviços estão **Up** e **Healthy**, sua aplicação meteorológica está funcionando!

- **Frontend:** http://localhost:3001
- **API:** http://localhost:3000
- **Dashboard de monitoramento:** Verifique os logs com `docker-compose logs -f`

---

## 📝 Credenciais Importantes

- **PostgreSQL:** temperatura_user / temperatura_pass
- **Grafana:** admin / admin_temp_2025  
- **OpenWeather API:** e3ac0577cd7c582a648ded6903a330f1

---

💡 **Dica:** Mantenha este guia salvo, você vai usar com frequência durante o desenvolvimento!
