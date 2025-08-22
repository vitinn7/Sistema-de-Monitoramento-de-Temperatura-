# Guia de Deployment - Sistema de Monitoramento de Temperatura

## Visão Geral

Este guia fornece instruções detalhadas para realizar o deployment do Sistema de Monitoramento de Temperatura em ambiente de produção.

## Pré-requisitos

### Servidor de Produção
- **Sistema Operacional:** Ubuntu 20.04 LTS ou superior
- **Recursos Mínimos:**
  - 2 CPU cores
  - 4GB RAM
  - 20GB de armazenamento SSD
  - Conexão de internet estável

### Software Necessário
- Docker 20.10+
- Docker Compose 2.0+
- Nginx 1.18+
- PostgreSQL 13+ (ou usar container)
- Redis 6+ (ou usar container)
- Node.js 18+ (para builds locais)

### Serviços Externos
- **OpenWeather API Key:** Necessária para coleta de dados meteorológicos
- **SMTP Server:** Para envio de alertas por email (opcional)
- **Domínio:** Para configuração SSL (recomendado)

## Configuração de Ambiente

### 1. Variáveis de Ambiente

Crie o arquivo `.env` baseado no `.env.example`:

```bash
# Database Configuration
DATABASE_URL=postgresql://temperatura_user:sua_senha_segura@postgres:5432/temperatura_db
DB_HOST=postgres
DB_PORT=5432
DB_NAME=temperatura_db
DB_USER=temperatura_user
DB_PASSWORD=sua_senha_segura

# Redis Configuration
REDIS_URL=redis://redis:6379
REDIS_HOST=redis
REDIS_PORT=6379

# API Configuration
NODE_ENV=production
PORT=3000
API_VERSION=v1
CORS_ORIGIN=https://seu-dominio.com

# OpenWeather API
OPENWEATHER_API_KEY=e3ac0577cd7c582a648ded6903a330f1
OPENWEATHER_BASE_URL=http://api.openweathermap.org/data/2.5

# Security
JWT_SECRET=sua_chave_jwt_super_secreta_aqui
BCRYPT_ROUNDS=12

# Email Configuration (Opcional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASSWORD=sua_senha_app
EMAIL_FROM=alerts@seu-dominio.com

# Monitoring
LOG_LEVEL=info
HEALTH_CHECK_INTERVAL=30000
METRICS_ENABLED=true
```

### 2. Configuração de Banco de Dados

Para produção, recomenda-se usar PostgreSQL gerenciado ou configurado manualmente:

```bash
# Conectar ao PostgreSQL como superusuário
sudo -u postgres psql

# Executar scripts de configuração
\i /caminho/para/01_CONFIGURACAO_INICIAL.sql
\c temperatura_db
\i /caminho/para/02_SCHEMA_E_DADOS.sql
```

## Deployment com Docker (Recomendado)

### 1. Preparação do Servidor

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
sudo usermod -aG docker $USER

# Instalar Docker Compose
sudo apt install docker-compose-plugin -y

# Reiniciar sessão para aplicar grupos
logout
```

### 2. Deploy da Aplicação

```bash
# Clonar repositório
git clone https://seu-repositorio/sistema-temperatura.git
cd sistema-temperatura

# Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com suas configurações

# Construir e iniciar containers
docker compose -f docker-compose.prod.yml up -d

# Verificar status
docker compose ps

# Verificar logs
docker compose logs -f
```

### 3. Configuração do Nginx

Crie o arquivo `/etc/nginx/sites-available/temperatura-app`:

```nginx
server {
    listen 80;
    server_name seu-dominio.com www.seu-dominio.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name seu-dominio.com www.seu-dominio.com;

    # SSL Configuration
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;

    # Frontend (React)
    location / {
        proxy_pass http://localhost:5173;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Rate Limiting
        limit_req zone=api burst=10 nodelay;
    }

    # WebSocket support (se necessário)
    location /ws {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}

# Rate limiting configuration
http {
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
}
```

Ativar o site:

```bash
sudo ln -s /etc/nginx/sites-available/temperatura-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Deployment Manual (Alternativo)

### 1. Backend Deployment

```bash
# Preparar backend
cd backend
npm ci --production
npm run build

# Configurar PM2 para gerenciamento de processos
npm install -g pm2
pm2 start dist/server.js --name temperatura-backend
pm2 startup
pm2 save
```

### 2. Frontend Deployment

```bash
# Build do frontend
cd frontend
npm ci
npm run build

# Servir arquivos estáticos com Nginx
sudo cp -r dist/* /var/www/html/
```

## Configuração SSL com Let's Encrypt

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obter certificado SSL
sudo certbot --nginx -d seu-dominio.com -d www.seu-dominio.com

# Configurar renovação automática
sudo crontab -e
# Adicionar linha:
0 3 * * * /usr/bin/certbot renew --quiet
```

## Monitoramento e Health Checks

### 1. Health Check Endpoints

A aplicação expõe endpoints de monitoramento:

- `GET /health` - Status geral da aplicação
- `GET /health/database` - Status do banco de dados
- `GET /health/redis` - Status do Redis
- `GET /health/api` - Status da API OpenWeather
- `GET /metrics` - Métricas Prometheus (se habilitado)

### 2. Configuração de Monitoramento

```bash
# Script de monitoramento básico
#!/bin/bash
# /opt/scripts/health-check.sh

BACKEND_URL="https://seu-dominio.com/api/health"
FRONTEND_URL="https://seu-dominio.com"

# Check Backend
if curl -f -s $BACKEND_URL > /dev/null; then
    echo "Backend OK"
else
    echo "Backend FAILED"
    # Enviar alerta ou reiniciar serviço
fi

# Check Frontend
if curl -f -s $FRONTEND_URL > /dev/null; then
    echo "Frontend OK"
else
    echo "Frontend FAILED"
fi
```

Configurar cron para executar a cada 5 minutos:

```bash
*/5 * * * * /opt/scripts/health-check.sh >> /var/log/health-check.log
```

## Backup e Recovery

### 1. Backup do Banco de Dados

```bash
#!/bin/bash
# /opt/scripts/backup-db.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/backups"
DB_NAME="temperatura_db"

# Criar backup
pg_dump -h localhost -U temperatura_user -d $DB_NAME > $BACKUP_DIR/db_backup_$DATE.sql

# Manter apenas backups dos últimos 7 dias
find $BACKUP_DIR -name "db_backup_*.sql" -mtime +7 -delete
```

### 2. Recovery do Banco de Dados

```bash
# Restaurar backup específico
psql -h localhost -U temperatura_user -d temperatura_db < /opt/backups/db_backup_YYYYMMDD_HHMMSS.sql
```

### 3. Backup de Configurações

```bash
#!/bin/bash
# Backup de arquivos de configuração
tar -czf /opt/backups/config_backup_$(date +%Y%m%d).tar.gz \
  /etc/nginx/sites-available/temperatura-app \
  /path/to/app/.env \
  /path/to/app/docker-compose.prod.yml
```

## Troubleshooting

### Problemas Comuns

1. **Container não inicia:**
   ```bash
   docker compose logs [service_name]
   docker compose down && docker compose up -d
   ```

2. **Banco de dados não conecta:**
   ```bash
   # Verificar status do PostgreSQL
   docker compose exec postgres pg_isready
   
   # Verificar logs
   docker compose logs postgres
   ```

3. **API retorna 502:**
   ```bash
   # Verificar status do backend
   curl http://localhost:3000/health
   
   # Verificar logs do Nginx
   sudo tail -f /var/log/nginx/error.log
   ```

4. **Frontend não carrega:**
   ```bash
   # Verificar build do frontend
   docker compose exec frontend npm run build
   
   # Verificar configuração do Nginx
   sudo nginx -t
   ```

### Logs Importantes

- **Backend:** `docker compose logs backend`
- **Database:** `docker compose logs postgres`
- **Nginx:** `/var/log/nginx/access.log` e `/var/log/nginx/error.log`
- **Sistema:** `/var/log/syslog`

## Atualizações

### 1. Atualização via Docker

```bash
# Parar aplicação
docker compose down

# Atualizar código
git pull origin main

# Rebuildar e reiniciar
docker compose -f docker-compose.prod.yml up -d --build

# Verificar status
docker compose ps
```

### 2. Rollback

```bash
# Voltar para versão anterior
git checkout [tag_version]
docker compose -f docker-compose.prod.yml up -d --build
```

## Segurança

### 1. Firewall Configuration

```bash
# Configurar UFW
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw deny 3000  # Bloquear acesso direto ao backend
sudo ufw deny 5432  # Bloquear acesso direto ao PostgreSQL
```

### 2. Updates de Segurança

```bash
# Atualizações automáticas
sudo apt install unattended-upgrades -y
sudo dpkg-reconfigure unattended-upgrades
```

### 3. Monitoramento de Logs

```bash
# Configurar Fail2Ban para proteção adicional
sudo apt install fail2ban -y
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
```

## Performance Optimization

### 1. Nginx Caching

Adicionar ao arquivo de configuração do Nginx:

```nginx
# Cache estático
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

# Cache API (cuidadoso com dados em tempo real)
location /api/cities {
    proxy_pass http://localhost:3000;
    proxy_cache_valid 200 1h;
}
```

### 2. Database Optimization

```sql
-- Análise de performance
ANALYZE;

-- Verificar índices utilizados
SELECT * FROM pg_stat_user_indexes;

-- Configurações recomendadas para produção
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET work_mem = '4MB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
SELECT pg_reload_conf();
```

Este guia fornece uma base sólida para deployment em produção. Ajuste as configurações conforme suas necessidades específicas e ambiente de infraestrutura.
